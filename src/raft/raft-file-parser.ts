import * as _ from 'underscore';

import {Build} from './build-config';
import * as CMake from './cmake';
import {Path} from './path';
import {Project} from './project';
import {RepositoryDependency, CMakeDependency, Dependency} from './dependency';
import {DependencyDescriptor, RepositoryDescriptor, RaftfileRoot} from './raft-file-descriptor';
import {Repository, GitRepository} from './vcs';


/**
 * Create a Dependency object given a dependency descriptor from a raftfile.
 * @param  {RaftFile.DependencyDescriptor} dependencyDescriptor Descriptor of a dependency loaded from a raft file.
 * @return {[type]}                                             An object that can be used to interact with the dependency.
 */
export function createDependency(dependencyDescriptor : DependencyDescriptor, raftDir : Path) {
    let repo = createRepository(dependencyDescriptor.repository);
    let buildSystem = dependencyDescriptor.buildSystem;

    let patches : Path [] = [];
    if (dependencyDescriptor.patches) {
        for (let patch of dependencyDescriptor.patches) {
            patches.push(raftDir.append(patch));
        }
    }

    if (buildSystem === "cmake") {
        return new CMakeDependency(dependencyDescriptor, repo, patches);
    } else if (buildSystem === "raft") {
        return new RaftDependency(dependencyDescriptor, repo, patches);
    } else {
        throw Error("unknown build system type");
    }
}

/**
 * Create a Repostitory object given a descriptor from a raftfile.
 * @param  {RaftFile.RepositoryDescriptor} repoDescriptor The descriptor loaded from a raftfile.
 * @return {Repository}                               An object that can be used to interact with the repository.
 */
export function createRepository(repoDescriptor : RepositoryDescriptor) : Repository {
    if (repoDescriptor.type) {
        return new GitRepository(repoDescriptor.location, repoDescriptor.branch);
    } else {
        throw Error("Unknown repository type");
    }
}

/**
 * A dependency that uses Raft for managing its own dependencies.
 */
export class RaftDependency extends RepositoryDependency {
    private project : Project;

    /**
     * @see Dependency.download
     */
    async download(project : Project, build : Build)  {
        let buildLocation = project.dirForDependency(this.name);
        await super.download(project, build);
        this.project = await Project.find(buildLocation);
        
        if (this.project.root.equals(project.root)) {
            throw Error(`The Dependency ${this.name} is not a raft dependency`);
        }
        
        let dependencies = _.map(this.project.dependencies(), (dependency) => createDependency(dependency, this.project.raftDir));
        for (let dependency of dependencies) {
            await dependency.download(project, build);
        }
    }

    /**
     * @see Dependency.buildInstall
     */
    async buildInstall(project : Project, build : Build) {
        let buildPath = project.dirForDependencyBuild(this.name, build);
        let dependencies : Dependency[] = _.map(this.project.dependencies(), (dependency) => createDependency(dependency, this.project.raftDir));

        for (let dependency of dependencies) {
            await dependency.buildInstall(project, build);
        }
        let options = this.project.cmakeOptions(project, build);
        await CMake.configure(this.project.root, buildPath, options);
        await CMake.build(buildPath);
        await CMake.install(buildPath);
    }
}
