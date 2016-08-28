import Promise = require('bluebird');
import _ = require('underscore');

import CMake = require('./CMake');
import Dependency = require('./Dependency');
import Path = require('./Path');
import Project = require('./Project')
import VCS = require('./VCS');
import {DependencyDescriptor, RepositoryDescriptor, RaftfileRoot} from './RaftFileDescriptor';

import {Build} from './build-config';


/**
 * Create a Dependency object given a dependency descriptor from a raftfile.
 * @param  {RaftFile.DependencyDescriptor} dependencyDescriptor Descriptor of a dependency loaded from a raft file.
 * @return {[type]}                                             An object that can be used to interact with the dependency.
 */
export function createDependency(dependencyDescriptor : DependencyDescriptor, raftDir : Path) {
    var repo = createRepository(dependencyDescriptor.repository);
    var buildSystem = dependencyDescriptor.buildSystem;

    var patches : Path [] = [];
    if (dependencyDescriptor.patches) {
        for (let patch of dependencyDescriptor.patches) {
            patches.push(raftDir.append(patch));
        }
    }

    if (buildSystem === "cmake") {
        return new Dependency.CMakeDependency(dependencyDescriptor, repo, patches);
    } else if (buildSystem === "raft") {
        return new RaftDependency(dependencyDescriptor, repo, patches);
    } else {
        throw Error("unknown build system type");
    }
}

/**
 * Create a Repostitory object given a descriptor from a raftfile.
 * @param  {RaftFile.RepositoryDescriptor} repoDescriptor The descriptor loaded from a raftfile.
 * @return {VCS.Repository}                               An object that can be used to interact with the repository.
 */
export function createRepository(repoDescriptor : RepositoryDescriptor) : VCS.Repository {
    if (repoDescriptor.type) {
        return new VCS.GitRepository(repoDescriptor.location, repoDescriptor.branch);
    } else {
        throw Error("Unknown repository type");
    }
}

/**
 * A dependency that uses Raft for managing its own dependencies.
 */
export class RaftDependency extends Dependency.RepositoryDependency {
    private project : Project;

    /**
     * @see Dependency.Dependency.download
     */
    download(project : Project, build : Build) : Promise<any> {
        var buildLocation = project.dirForDependency(this.name);
        return super.download(project, build)
        .then(() => Project.find(buildLocation))
        .then((thisProject) => {
            this.project = thisProject;

            if (this.project.root.equals(project.root)) {
                throw Error(`The Dependency ${this.name} is not a raft dependency`);
            }

            var dependencies = _.map(this.project.dependencies(), (dependency) => createDependency(dependency, this.project.raftDir));
            return Promise.map(
                dependencies,
                (dependency) => dependency.download(project, build)
            );
        });
    }

    /**
     * @see Dependency.Dependency.buildInstall
     */
    buildInstall(project : Project, build : Build) : Promise<any> {
        var buildPath = project.dirForDependencyBuild(this.name, build);
        var dependencies = _.map(this.project.dependencies(), (dependency) => createDependency(dependency, this.project.raftDir));

        return Promise.map(
            dependencies,
            (dependency) => dependency.buildInstall(project, build)
        ).then(() => {
            var options = this.project.cmakeOptions(project, build);
            return CMake.configure(this.project.root, buildPath, options);
        }).then(() => {
            return CMake.build(buildPath);
        }).then(() => {
            return CMake.install(buildPath);
        })
    };
}
