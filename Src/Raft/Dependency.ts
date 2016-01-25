import _ = require('underscore');

import BuildConfig = require('./BuildConfig')
import CMake = require('./CMake')
import Project = require('./Project')
import Path = require('./Path')
import RaftFile = require('./RaftFile')
import VCS = require('./VCS')

import raftlog = require('./Log')

/**
 * Interface used to interact with a build dependency.
 */
export interface Dependency {
    /**
     * The name of the dependency.  Must be unique in a build.
     * @type {string}
     */
    name : string;
    /**
     * Download the source and binaries used by the dependency.
     * @param  {Project}           project Root raft project that is being built.
     * @param  {BuildConfig.Build} build   Configuration for the current build.
     * @return {Promise<any>}              A promise that resolves once the download is finished.
     */
    download(project : Project, build : BuildConfig.Build) : Promise<any>;
    /**
     * Build the dependency and install it so that it is accessible to other dependencies
     * and the root project.
     * @param  {Project}           project Root raft project that is being built.
     * @param  {BuildConfig.Build} build   Configuration for the current build.
     * @return {Promise<any>}              A promise that resolves once the project is built and installed.
     */
    buildInstall(project : Project, build : BuildConfig.Build) : Promise<any>;
}

/**
 * A dependency that downloads its source from a repository.
 */
export class RepositoryDependency implements Dependency {
    name : string;
    repository : VCS.Repository;

    /**
     * @param  {string}         name The name of the dependency.
     * @param  {VCS.Repository} repo The repository the source can be downloaded from.
     */
    constructor(name : string, repo : VCS.Repository) {
        this.name = name;
        this.repository = repo;
    }

    /**
     * @see Dependency.Dependency.download
     */
    download(project : Project, build : BuildConfig.Build) : Promise<any> {
        return this.repository.download(project.dirForDependency(this.name));
    }

    /**
     * @see Dependency.Dependency.buildInstall
     */
    buildInstall(project : Project, build : BuildConfig.Build) : Promise<any> { return null };
}

/**
 * A dependency that can be used to build a standard CMake project.
 */
export class CMakeDependency extends RepositoryDependency {
    /**
     * @see Dependency.Dependency.buildInstall
     */
    buildInstall(project : Project, build : BuildConfig.Build) : Promise<any> {
        var sourceLocation = project.dirForDependency(this.name);
        var buildLocation = project.dirForDependencyBuild(this.name, build);
        var installLocation = project.dirForDependencyInstall(build);
        var cmakeOptions = CMake.CMakeOptions.create(installLocation);

        return CMake.configure(sourceLocation, buildLocation, cmakeOptions)
        .then(() => {
            return CMake.build(buildLocation);
        }).then(() => {
            return CMake.install(buildLocation);
        });
    }
}

/**
 * Download, build, and install the dependency for the project and build configuration.
 * @param  {Project}           project    The root raft project.
 * @param  {BuildConfig.Build} build      The configuration of the current build.
 * @param  {Dependency}        dependency The dependency that is being built.
 * @return {Promise<any>}                 A promise that resolves once the dependency is ready for use.
 */
export function getDependency(project : Project, build : BuildConfig.Build, dependency : Dependency) {
    raftlog(dependency.name, "Downloading");
    return dependency.download(project, build)
    .then(() => {
        raftlog(dependency.name, "Building");
        return dependency.buildInstall(project, build);
    }).then(() => {
        raftlog(dependency.name, "Ready");
    });
}
