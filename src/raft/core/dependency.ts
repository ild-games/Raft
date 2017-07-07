
import * as _ from 'underscore';

import {CMakeBuild, CMakeOptions} from './cmake';
import {raftlog} from './log';
import {DependencyDescriptor} from './raft-file-descriptor';
import {Build} from './build-config';
import {Path} from './path';
import {Project} from './project';
import {Repository} from './vcs';

/**
 * Interface used to interact with a build dependency.
 */
export interface Dependency {
    /**
     * The name of the dependency.  Must be unique in a build.
     */
    name : string;

    /**
     * Patches that are applied to the dependency.
     */
    patches : Path [];

    /**
     * Download the source and binaries used by the dependency.
     * @param  project Root raft project that is being built.
     * @param  build   Configuration for the current build.
     * @return A promise that resolves once the download is finished.
     */
    download(project : Project, build : Build) : Promise<any>;

    /**
     * Build the dependency and install it so that it is accessible to other dependencies
     * and the root project.
     * @param project Root raft project that is being built.
     * @param build   Configuration for the current build.
     * @return A promise that resolves once the project is built and installed.
     */
    buildInstall(project : Project, build : Build) : Promise<any>;
}

/**
 * A dependency that downloads its source from a repository.
 */
export class RepositoryDependency implements Dependency {
    /**
     * @param  name The name of the dependency.
     * @param  repo The repository the source can be downloaded from.
     * @param  patches Array of patches that will be applied to the dependency.
     */
    constructor(public descriptor : DependencyDescriptor, public repository : Repository, public patches : Path []) {
    }

    /**
     * @see Dependency.Dependency.download
     */
    async download(project : Project, build : Build) : Promise<any> {

        var dependencyDir = project.dirForDependency(this.name);

        if (dependencyDir.exists()) {
            return Promise.resolve(null);
        }

        await this.repository.download(dependencyDir);
        for (let patch of this.patches) {
            await this.repository.patch(dependencyDir, patch);
        }
    }

    /**
     * @see Dependency.Dependency.buildInstall
     */
    buildInstall(project : Project, build : Build) : Promise<any> { return null };

    get name () {
        return this.descriptor.name;
    }
}

/**
 * A dependency that can be used to build a standard CMake project.
 */
export class CMakeDependency extends RepositoryDependency {
    /**
     * @see Dependency.Dependency.buildInstall
     */
    async buildInstall(project : Project, build : Build) : Promise<any> {
        var sourceLocation = project.dirForDependency(this.name);
        var buildLocation = project.dirForDependencyBuild(this.name, build);
        var installLocation = project.dirForDependencyInstall(build);
        var cmakeOptions = CMakeOptions
            .create(installLocation)
            .isReleaseBuild(build.releaseBuild)
            .architecture(build.architecture)
            .configOptions(this.descriptor.configOptions);

        let cmakeBuild = new CMakeBuild(buildLocation, build);
        await cmakeBuild.configure(sourceLocation, cmakeOptions);
        await cmakeBuild.build();
        await cmakeBuild.install();
    }
}

/**
 * Download, build, and install the dependency for the project and build configuration.
 * @param  project    The root raft project.
 * @param  build      The configuration of the current build.
 * @param  dependency The dependency that is being built.
 * @return A promise that resolves once the dependency is ready for use.
 */
export function getDependency(project : Project, build : Build, dependency : Dependency) {
    raftlog(dependency.name, "Downloading");
    return dependency.download(project, build)
    .then(() => {
        raftlog(dependency.name, "Building");
        return dependency.buildInstall(project, build);
    }).then(() => {
        raftlog(dependency.name, "Ready");
    });
}

/**
 * A dependency that uses Raft for managing its own dependencies.
 */
export class RaftDependency extends RepositoryDependency {

    constructor(public descriptor : DependencyDescriptor,
                public repository : Repository,
                public patches : Path [],
                private _createDependency : (descriptor : DependencyDescriptor, raftDir : Path) => Dependency) {
        super(descriptor, repository, patches);
    }

    private project : Project;

    /**
     * @see Dependency.download
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

            var dependencies = this.project.dependencies().map(dependency => this._createDependency(dependency, this.project.raftDir));
            return Promise.all(dependencies.map((dependency) => dependency.download(project, build)));
        });
    }

    /**
     * @see Dependency.buildInstall
     */
    async buildInstall(project : Project, build : Build) : Promise<any> {
        var buildPath = project.dirForDependencyBuild(this.name, build);
        var dependencies = this.project.dependencies().map(dependency => this._createDependency(dependency, this.project.raftDir));

        await Promise.all(dependencies.map(dependency => dependency.buildInstall(project, build)));

        var options = this.project.cmakeOptions(project, build);
        options =  options.configOptions(this.descriptor.configOptions || []);
        let cmakeBuild = new CMakeBuild(buildPath, build);

        await cmakeBuild.configure(this.project.root, options);
        await cmakeBuild.build();
        await cmakeBuild.install();
    };
}
