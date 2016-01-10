import BuildConfig = require('./BuildConfig');
import CMake = require('./CMake');
import Dependency = require('./Dependency');
import Path = require('./Path');
import RaftFile = require('./RaftFile');

import raftlog = require('./log');

class Project {
    private static RAFT_DIR = new Path('Raft');
    private static RAFT_FILE = Project.RAFT_DIR.append('raftfile.json');
    private static BUILD_DIR = new Path('build');
    private static DEPENDENCY_DIR = Project.RAFT_DIR.append('libs');
    private static DEPENDENCY_SRC_DIR = Project.DEPENDENCY_DIR.append('src');
    private static DEPENDENCY_BUILD_DIR = Project.DEPENDENCY_DIR.append('build');
    private static DEPENDENCY_INSTALL_DIR = Project.DEPENDENCY_DIR.append('install');
    private static DEPENDENCY_LIB_DIR = new Path('lib');
    private static DEPENDENCY_INC_DIR = new Path('include');

    private raftfile : RaftFile.Root;

    constructor(root : Path) {
        this.root = root;
    }

    /**
    *  Will walk up the file tree until the root directory of a project is found.
    *  @param path The path to start the search from
    *  @return Returns the project if it exists or null if it does not.
    */
    static find(path : Path) : Promise<Project> {
        var paths = [path];
        var raftDir = new Path("Raft");

        while (!_.last(paths).isRoot()) {
            paths.push(_.last(paths).parent());
        }

        var rootDir = _.first(_.filter(paths, (path) => path.append(raftDir).exists()));

        if (rootDir) {
            return (new Project(rootDir)).load();
        } else {
            return Promise.reject(null);
        }
    }

    load() : Promise<Project> {
        return this.root.append(Project.RAFT_FILE).read()
        .then((data) => {
            raftlog("Project Data", data);
            this.raftfile = JSON.parse(data);
            raftlog("Project Data", JSON.stringify(this.raftfile));
            return this;
        });
    }

    dependencies() : Dependency.Dependency [] {
        return _.map(this.raftfile.dependencies, Dependency.createDependency);
    }

    dirForDependency(dependency : Dependency.Dependency) : Path {
        return this.root.append(Project.DEPENDENCY_SRC_DIR, dependency.name);
    }

    dirForDependencyBuild(dependency : Dependency.Dependency, build : BuildConfig.Build) {
        return this.root.append(
            Project.DEPENDENCY_BUILD_DIR,
            build.platform,
            build.architecture,
            dependency.name);
        }

    dirForDependencyInstall(build :BuildConfig.Build) {
        return this.root.append(
            Project.DEPENDENCY_INSTALL_DIR,
            build.platform,
            build.architecture);
    }

    dirForDependencyLib(build :BuildConfig.Build) {
        return this.dirForDependencyInstall(build).append(Project.DEPENDENCY_LIB_DIR);
    }

    dirForDependencyInc(build :BuildConfig.Build) {
        return this.dirForDependencyInstall(build).append(Project.DEPENDENCY_INC_DIR);
    }

    dirForBuild(build :BuildConfig.Build) {
        if (build.isDeploy) {
            throw Error("deploy has not been implemented");
        } else {
            return this.root.append(Project.BUILD_DIR);
        }
    }

    build(build :BuildConfig.Build) : Promise<any> {
        var buildPath = this.dirForBuild(build);

        var cmakeOptions = {
            RAFT : CMake.raftCmakeFile().toString(),
            RAFT_INCLUDE_DIR : this.dirForDependencyInc(build).toString(),
            RAFT_LIB_DIR : this.dirForDependencyLib(build).toString(),
            RAFT_IS_DESKTOP : true,
            RAFT_IS_ANDROID : false,
        }

        console.log(`Raft file location ${cmakeOptions.RAFT}`)

        return CMake.configure(this.root, buildPath, cmakeOptions)
        .then(() => {
            return CMake.build(buildPath);
        });
    }

    //What do I need for the project?
    // Where it is located
    // Its configuration
    // Its current state
    root : Path;
}

export = Project;
