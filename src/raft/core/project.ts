
import * as _ from 'underscore';

import * as CMake from './cmake';
import {DependencyDescriptor, RaftfileRoot} from './raft-file-descriptor';
import {Build, Platform, Architecture} from './build-config';
import {raftlog} from './log';
import {Path} from './path';

/**
 * Describes a raft project. Contains project data, configuration, and project specific paths.
 */
export class Project {
    private static RAFT_DIR = new Path('Raft');
    private static RAFT_FILE = Project.RAFT_DIR.append('raftfile.json');
    private static BUILD_DIR = new Path('build');
    private static DEPENDENCY_DIR = Project.RAFT_DIR.append('libs');
    private static DEPENDENCY_SRC_DIR = Project.DEPENDENCY_DIR.append('src');
    private static DEPENDENCY_BUILD_DIR = Project.DEPENDENCY_DIR.append('build');
    private static DEPENDENCY_INSTALL_DIR = Project.DEPENDENCY_DIR.append('install');
    private static DEPENDENCY_LIB_DIR = new Path('lib');
    private static DEPENDENCY_INC_DIR = new Path('include');
    private static DEPENDENCY_FRAMEWORK_DIR = new Path(CMake.FRAMEWORK_DIR);

    private raftfile : RaftfileRoot;

    constructor(root : Path) {
        this.root = root;
    }

    /**
    *  Will walk up the file tree until the root directory of a project is found.
    *  @param path The path to start the search from
    *  @return Returns the project if it exists or null if it does not.
    */
    static find(path : Path) : Promise<Project> {
        var raftDir = new Path("Raft");
        var currentPath = path;

        while (!currentPath.isRoot()) {
            if (currentPath.append(raftDir).exists()) {
                return (new Project(currentPath)).load();
            }
            currentPath = currentPath.parent();
        }

        return Promise.reject(null);
    }

    /**
     * Load a project from the raftfile.
     * @return {Promise<Project>} A promise that resolves to a loaded project.
     */
    load() : Promise<Project> {
        return this.root.append(Project.RAFT_FILE).read()
        .then((data) => {
            raftlog("Project Data", data);
            this.raftfile = JSON.parse(data);
            return this;
        });
    }

    /**
     * Get the dependency descriptor's contained in the project's raftfile.
     * @return {RaftFile.DependencyDescriptor} The raw dependencies available in the raft file.
     */
    dependencies() : DependencyDescriptor [] {
        return this.raftfile.dependencies.slice(0);
    }

    /**
     * Get the directory that should be used to store the dependency's source.
     * @param  {string} name Name of the dependency.
     * @return {Path}        Path describing where the source should be stored.
     */
    dirForDependency(name : string) : Path {
        return this.root.append(Project.DEPENDENCY_SRC_DIR, name);
    }

    /**
     * Get the folder where the dependency should be built.
     * @param  {string}            name  Name of the dependency.
     * @param  {Build} build The configuration for the current build.
     * @return {Path}                    Path describing where the dependency should be built.
     */
    dirForDependencyBuild(name : string, build : Build) {
        return this.root.append(
            Project.DEPENDENCY_BUILD_DIR,
            build.platform.name,
            build.architecture.name,
            name);
    }

    /**
     * Get the folder where the dependencies should be installed.
     * @param  {Build} build The configuration for the current build.
     * @return {Path}                  Path describing where dependencies should be installed.
     */
    dirForDependencyInstall(build :Build) {
        return this.root.append(
            Project.DEPENDENCY_INSTALL_DIR,
            build.platform.name,
            build.architecture.name);
    }

    /**
     * Get the folder where the dependencies library binaries should be installed.
     * @param  {Build} build The configuration for the current build.
     * @return {Path}                  Path describing where the library binaries should be installed.
     */
    dirForDependencyLib(build : Build) {
        return this.dirForDependencyInstall(build).append(Project.DEPENDENCY_LIB_DIR);
    }

    /**
     * Get the folder where the dependency headers should be installed.
     * @param  {Build} build The configuration for the current build.
     * @return {Path}                  Path describing where the dependency headers should be installed.
     */
    dirForDependencyInc(build : Build) {
        return this.dirForDependencyInstall(build).append(Project.DEPENDENCY_INC_DIR);
    }

    /**
     * Get the folder where the dependency frameworks should be installed.
     * @param  {Build} build The configuration for the current build.
     * @return {[type]}                  Path describing where the framework headers should be installed.
     */
    dirForDependencyFramework(build : Build) {
        return this.dirForDependencyInstall(build).append(Project.DEPENDENCY_FRAMEWORK_DIR);
    }

    /**
     * Get the directory the project should be built in.
     * @param  {Build} build The current build configuration.
     * @return {Path}                    The directory the project should be built in.
     */
    dirForBuild(build : Build) {
        return this.root.append(Project.BUILD_DIR);
    }

    /**
     * Build the project.
     * @param  {Build} build The current build configuration.
     * @return {Promise<any>}            A promise that resolves when the build is finished.
     */
    build(build : Build) : Promise<any> {
        var buildPath = this.dirForBuild(build);
        var cmakeOptions = this.cmakeOptions(this, build)
        return CMake.configure(this.root, buildPath, cmakeOptions)
        .then(() => {
            return CMake.build(buildPath);
        });
    }

    /**
     * Get the cmake options that should be used when building the project.
     * @param  {Project}           rootProject Root raft project for the current build.
     * @param  {Build} build       Configuration for the current build.
     * @return {object}                        CMake options that should be used for the build.
     */
    cmakeOptions(rootProject : Project, build : Build) : CMake.CMakeOptions {
        var installPath : Path;
        if (this === rootProject) {
            installPath = this.root.append("install");
        } else {
            installPath = rootProject.dirForDependencyInstall(build);
        }

        return CMake.CMakeOptions
            .create(installPath)
            .isReleaseBuild(build.releaseBuild)
            .raftIncludeDir(rootProject.dirForDependencyInc(build))
            .raftLibDir(rootProject.dirForDependencyLib(build))
            .raftFrameworkDir(rootProject.dirForDependencyFramework(build))
            .architecture(build.architecture);
    }

    /**
     * Root directory of the project.
     */
    root : Path;

    get raftDir() {
        return this.root.append("Raft");
    }
}
