import _ = require('underscore');

import BuildConfig = require('./BuildConfig');
import CMake = require('./CMake');
import Dependency = require('./Dependency');
import Project = require('./Project')
import VCS = require('./VCS');

/**
 * Included in raftfiles to allow configuration of Dependencies.
 */
export interface DependencyDescriptor {
    /**
     * Name that should be used for the dependency.
     * @type {string}
     */
    name : string,
    /**
     * Describes the repository that can be used to download the dependency.
     * @type {RepositoryDescriptor}
     */
    repository : RepositoryDescriptor,
    /**
     * Describes the build system used by the dependency.
     * Options:
     *     cmake
     *     raft
     * @type {string}
     */
    buildSystem : string
}

/**
 * Included in raftfiles to allow configuration of source repositories.
 */
export interface RepositoryDescriptor {
    /**
     * The type of repository.
     * Options:
     *     git
     * @type {string}
     */
    type : string,
    /**
     * a URI describing where the repository can be found.
     * @type {string}
     */
    location : string,
    /**
     * Optional paramater used to describe the branch that should be used.
     * @type {[type]}
     */
    branch? : string
}

/**
 * Describes the possible format of a RaftFile used to describe raft projects..
 */
export interface Root {
    dependencies : DependencyDescriptor[];
}

/**
 * Create a Dependency object given a dependency descriptor from a raftfile.
 * @param  {RaftFile.DependencyDescriptor} dependencyDescriptor Descriptor of a dependency loaded from a raft file.
 * @return {[type]}                                             An object that can be used to interact with the dependency.
 */
export function createDependency(dependencyDescriptor : DependencyDescriptor) {
    var repo = createRepository(dependencyDescriptor.repository);
    var buildSystem = dependencyDescriptor.buildSystem;
    if (buildSystem === "cmake") {
        return new Dependency.CMakeDependency(dependencyDescriptor.name, repo);
    } else if (buildSystem === "raft") {
        return new RaftDependency(dependencyDescriptor.name, repo);
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
    console.log("Repo Branch: " + repoDescriptor.branch);
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
    download(project : Project, build : BuildConfig.Build) : Promise<any> {
        var buildLocation = project.dirForDependency(this.name);
        return super.download(project, build)
        .then(() => {
            return Project.find(buildLocation);
        }).then((thisProject) => {
            this.project = thisProject;

            if (this.project.root.equals(project.root)) {
                throw Error(`The Dependency ${this.name} is not a raft dependency`);
            }

            return Promise.all(_.map(
                _.map(this.project.dependencies(), createDependency),
                (dependency) => dependency.download(project, build)
            ));
        });
    }

    /**
     * @see Dependency.Dependency.buildInstall
     */
    buildInstall(project : Project, build : BuildConfig.Build) : Promise<any> {
        var buildPath = project.dirForDependencyBuild(this.name, build);
        return Promise.all(_.map(
            _.map(this.project.dependencies(), createDependency),
            (dependency) => dependency.buildInstall(project, build)
        )).then(() => {
            var options = this.project.cmakeOptions(project, build);
            return CMake.configure(this.project.root, buildPath, options);
        }).then(() => {
            return CMake.build(buildPath);
        }).then(() => {
            return CMake.install(buildPath);
        })
    };
}
