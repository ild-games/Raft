
import * as _ from 'underscore';

import {Architecture, Build, Platform} from './core/build-config';
import * as CMake from './core/cmake';
import {Path} from './core/path';
import {Project} from './core/project';
import {Dependency, CMakeDependency, RaftDependency} from './core/dependency';
import {DependencyDescriptor, RepositoryDescriptor, ArchitectureDescriptor} from './core/raft-file-descriptor';
import {Repository, GitRepository} from './core/vcs';
import {throwConfigurationError} from './core/error';

import {AndroidPlatform} from './platform/android';
import {iOSPlatform} from './platform/iOS';
import {macOSPlatform} from './platform/macOS';
import {HostPlatform} from './platform/host';


/**
 * Create a Dependency object given a dependency descriptor from a raftfile.
 * @param  {RaftFile.DependencyDescriptor} dependencyDescriptor Descriptor of a dependency loaded from a raft file.
 * @return {[type]}                                             An object that can be used to interact with the dependency.
 */
export function createDependency(dependencyDescriptor : DependencyDescriptor, raftDir : Path) : Dependency {
    var repo = createRepository(dependencyDescriptor.repository);
    var buildSystem = dependencyDescriptor.buildSystem;

    var patches : Path [] = [];
    if (dependencyDescriptor.patches) {
        for (let patch of dependencyDescriptor.patches) {
            patches.push(raftDir.append(patch));
        }
    }

    if (buildSystem === "cmake") {
        return new CMakeDependency(dependencyDescriptor, repo, patches);
    } else if (buildSystem === "raft") {
        return new RaftDependency(dependencyDescriptor, repo, patches, createDependency);
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

export interface SupportedArchitecture {
    architecture : Architecture,
    platform : Platform
}

/**
 * Given a raftfile determine which architectures it supports.
 */
export function getSupportedArchitectures(supportedArchitectures : ArchitectureDescriptor[]) : SupportedArchitecture [] {
    let supported : SupportedArchitecture[] = [];

    let platforms = [
        new HostPlatform(),
        new AndroidPlatform(),
        new iOSPlatform(),
        new macOSPlatform()
    ]

    for (let architecture of supportedArchitectures) {
        let foundPlatform = platforms.find(p => p.name.toUpperCase() === architecture.platform.toUpperCase());

        if (!foundPlatform) {
            throwConfigurationError(`unrecognized platform ${architecture.platform}`);
        }

        let foundArchitecture = foundPlatform
            .getArchitectures()
            .find(arch => arch.name.toUpperCase() === architecture.architecture.toUpperCase());

        if (!foundArchitecture) {
            throwConfigurationError(`unrecognized architecture ${architecture.architecture} for platform ${architecture.platform}`);
        }

        supported.push({
            architecture: foundArchitecture,
            platform: foundPlatform
        });
    }

    if (supported.length === 0) {
        let platform = platforms[0];
        supported.push({platform, architecture: platform.getDefaultArchitecture()});
    }

    return supported;
}
