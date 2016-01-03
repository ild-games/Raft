import _ = require('underscore');
import Promise = require('bluebird');
import fs = require('fs');
import os = require('os');
import npath = require('path');
import child_process = require('child_process');
import mkdirp = require('mkdirp');

import gulp = require('gulp');
import mustache = require('gulp-mustache')
import rename = require('gulp-rename')

module Raft {

    export module Action {
        export function defaultAction() {
            return build();
        }

        export function build(options : {platform? : string, architecture? : string} = {}) {
            var buildSettings : Build = {
                isDeploy : false,
                platform : Platform.getPlatform(options.platform),
                architecture : Platform.getArchitecture(options.architecture)
            };

            return Raft.Project.find(Raft.Path.cwd())
                .then(function(project) {
                    var dependencies = project.dependencies();
                    raftlog("Project", `Getting ${dependencies.length} for the project`);
                    var getDep = (dependency : Dependency) => getDependency(project, buildSettings, dependency);
                    return Promise
                    .all(_.map(dependencies, getDep))
                    .then(function (){
                        return project.build(buildSettings);
                    });
                });
        }

        export function create() {
            raftlog("Project", "Creating a new project");
            var templateDir = new Path("/home/jeff/Code/ILikeDucks/AnconaTemplateGame");
            var destinationDir = Path.cwd();

            var context = {
                gameName : "TestGame",
                gameAbbr : "TG"
            }

            return Template.useTemplate(templateDir, destinationDir, context);
        }
    }

    export module Platform {
        export enum Platform {
            Windows,
            Linux,
            OSX,
            Android
        }

        export enum Architecture {
            x64,
            x86,
            arm7
        }

        export function getPlatform(platform? : string) : string {
            return "host";
        }

        export function getArchitecture(architecture? : string) : string {
            return "host";
        }

        export function currentPlatorm() {
            //TODO Implement correctly
            return Platform.Linux;
        }

        export function currentArchitecture() {
            //TODO Implement correctly
            return Architecture.x64;
        }
    }



    export function raftlog(tag: string, message : string) {
        console.log(`${tag}:: ${message}`);
    }

    export module System {

        interface ProcessOutput {
            stdout : Buffer;
            stderr : Buffer;
        }

        interface ExecuteOptions {
            /**
             * The directory to use as the current working directory.  Will be created
             * if it does not already exist.
             */
            cwd? : Path,

            /**
             * The tag to use when logging events.
             */
            tag? : string
        }

        export function execute(command : string, options? : ExecuteOptions) : Promise<ProcessOutput> {
            options = options || {};
            var start = Promise.resolve();
            var nodeOptions : {cwd? : string} = {};
            var tag = options.tag || command;

            if (options.cwd) {
                raftlog(command,`Running in ${options.cwd.toString()}`);
                nodeOptions.cwd = options.cwd.toString();
                //Create the working directory if it does not exist.
                start = options.cwd.createDirectory().then((created) => {
                    if (created) {
                        raftlog(tag, `Created ${options.cwd.toString()}`);
                    }
                });
            } else {
                raftlog(tag, "Running in the current working directory");
            }

            return start.then(() => {
                return Promise.fromNode((callback) => {
                    child_process.exec(command, nodeOptions, callback);
                }, {multiArgs : true});
            }).then((buffers : Buffer []) => {
                raftlog(tag, "Finished successfullly");
                return { stdout : buffers[0], stderr : buffers[1]};
            });
        }
    }

    export interface Dependency {
        name : string;
        download(project : Project, build : Build) : Promise<any>;
        build(project : Project, build : Build) : Promise<any>;
        install(project : Project, build : Build) : Promise<any>;
    }

    export interface Repository {
        download(destination : Path) : Promise<any>;
    }

    export class GitRepository implements Repository {
        uri : string;

        constructor(uri : string) {
            this.uri = uri;
        }

        download(destination : Path) {
            return Git.getRepo(this.uri, destination);
        }
    }

    export class RepositoryDependency implements Dependency {
        name : string;
        repository : Repository;

        constructor(name : string, repo : Repository) {
            this.name = name;
            this.repository = repo;
        }

        download(project : Project, build : Build) : Promise<any> {
            return this.repository.download(project.dirForDependency(this));
        }

        build(project : Project, build : Build) : Promise<any> { return null };
        install(project : Project, build : Build) : Promise<any> { return null };
    }

    export class CMakeDependency extends RepositoryDependency {
        build(project : Project, build : Build) : Promise<any> {
            var sourceLocation = project.dirForDependency(this);
            var buildLocation = project.dirForDependencyBuild(this, build);
            var installLocation = project.dirForDependencyInstall(build);
            var cmakeOptions = { CMAKE_INSTALL_PREFIX : installLocation.toString()};

            return CMake.configure(sourceLocation, buildLocation, cmakeOptions)
            .then(() => {
                return CMake.build(buildLocation);
            });
        }

        install(project : Project, build : Build) : Promise<any> {
            return CMake.install(project.dirForDependencyBuild(this, build));
        }
    }

    export interface DependencyDescriptor {
        name : string,
        repository : RepositoryDescriptor,
        buildSystem : string
    }

    export interface RepositoryDescriptor {
        type : string,
        location : string
    }

    export interface ProjectDescriptor {
        dependencies : DependencyDescriptor[];
    }

    export function createDependency(dependencyDescriptor : DependencyDescriptor) {
        var repo = createRepository(dependencyDescriptor.repository);
        if (dependencyDescriptor.buildSystem === "cmake") {
            console.log("Creating a dependency");
            return new CMakeDependency(dependencyDescriptor.name, repo);
        } else {
            throw Error("unknown build system type");
        }
    }

    export function createRepository(repoDescriptor : RepositoryDescriptor) : Repository {
        if (repoDescriptor.type) {
            return new GitRepository(repoDescriptor.location);
        } else {
            throw Error("Unknown repository type");
        }
    }

    export interface Build {
        platform : string;
        architecture : string;
        isDeploy : boolean;
    }

    export function getDependency(project : Project, build : Build, dependency : Dependency) {
        raftlog(dependency.name, "Downloading");
        return dependency.download(project, build)
        .then(() => {
            raftlog(dependency.name, "Building");
            return dependency.build(project, build);
        }).then(() => {
            raftlog(dependency.name, "Installing");
            return dependency.install(project, build);
        }).then(() => {
            raftlog(dependency.name, "Ready");
        });
    }

    export interface Config {

    };

    export interface State {

    };

    export class Path {
        private path : string;
        //Imutable object.  Data model is a string, but it has several functions attached.
        constructor(pathStr : string) {
            this.path = pathStr;
        }

        append(... paths : (string|Path) []) : Path {
            var asStrings =  _.map(paths, (path) => path.toString());
            return new Path(npath.join(this.path, ...asStrings));
        }

        parent() : Path {
            return new Path(npath.dirname(this.path));
        }

        isRoot() : boolean {
            var parsedPath = npath.parse(this.path);
            return parsedPath.root === parsedPath.dir && parsedPath.root !== "";
        }

        toString() : string {
            return this.path;
        }

        exists() : boolean {
            try {
                fs.accessSync(this.path, fs.F_OK);
                return true;
            } catch (error) {
                return false;
            }
        }

        createDirectory() : Promise<boolean> {
            return Promise.fromNode((callback) => {
                mkdirp(this.path, callback);
            }).then((success) => {
                return true;
            }).catch((error) => {
                //TODO: Validate error was caused by directory existing.
                return false;
            });
        }

        read() : Promise<string> {
            return Promise
            .fromCallback((callback) => {
                fs.readFile(this.path.toString(), callback)
            }).then((buffer : Buffer) => {
                return buffer.toString();
            });
        }

        static cwd() : Path {
            return new Path(process.cwd());
        }
    }

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

        private raftfile : ProjectDescriptor;

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

        dependencies() : Dependency [] {
            return _.map(this.raftfile.dependencies, createDependency);
        }

        dirForDependency(dependency : Dependency) : Path {
            return this.root.append(Project.DEPENDENCY_SRC_DIR, dependency.name);
        }

        dirForDependencyBuild(dependency : Dependency, build : Build) {
            return this.root.append(
                Project.DEPENDENCY_BUILD_DIR,
                build.platform,
                build.architecture,
                dependency.name);
        }

        dirForDependencyInstall(build : Build) {
            return this.root.append(
                Project.DEPENDENCY_INSTALL_DIR,
                build.platform,
                build.architecture);
        }

        dirForDependencyLib(build : Build) {
            return this.dirForDependencyInstall(build).append(Project.DEPENDENCY_LIB_DIR);
        }

        dirForDependencyInc(build : Build) {
            return this.dirForDependencyInstall(build).append(Project.DEPENDENCY_INC_DIR);
        }

        dirForBuild(build : Build) {
            if (build.isDeploy) {
                throw Error("deploy has not been implemented");
            } else {
                return this.root.append(Project.BUILD_DIR);
            }
        }

        build(build : Build) : Promise<any> {
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
        state : State;
        config : Config;
    }
}

module Raft.Git {
    export function getRepo(uri : string, destination : Path) {
        if (destination.exists()) {
            return System.execute(`git pull`, { cwd : destination});
        } else {
            return System.execute(`git clone ${uri} ${destination.toString()}`);
        }
    }
}

module Raft.CMake {

    export function configure(
        srcPath : Path,
        buildPath : Path,
        options : any) : Promise<any> {

        var cmdOptions = _.chain(_.pairs(options))
            .map((option : string[]) => {
                return `-D${option[0]}=${option[1]}`
            })
            .join(" ");

        return System.execute(`cmake ${srcPath.toString()} ${cmdOptions}`, {cwd : buildPath});
    }

    export function build(buildPath : Path) {
        return System.execute(`make -j8`, {cwd : buildPath});
    }

    export function install(buildPath : Path) {
        return System.execute(`make install`, {cwd : buildPath});
    }

    export function raftCMakeDir() {
        return (new Path(__dirname)).parent().parent().parent().append('CMake');
    }

    export function raftCmakeFile() {
        return raftCMakeDir().append("Raft.cmake");
    }
}

module Raft.Dependencies {
    function getDependencies(project : Project) {

    }
}

module Raft.Template {

    interface ParsedPath {
        dirname?: string;
        basename?: string;
        extname?: string;
    }

    export function useTemplate(templatePath : Path, destination : Path, context : any) : Promise<any> {
        return new Promise((resolve, reject) => {
            var stream = gulp.src(templatePath.append("**").toString())
                .pipe(mustache(context))
                .pipe(rename(function(parsedpath : ParsedPath) {
                    return renameFile(parsedpath, context);
                }))
                .pipe(gulp.dest(destination.toString()));
            stream.on("finish", resolve);
            stream.on("error", reject);
        });
    }

    function renameFile(parsedpath : ParsedPath, context : any) {
        for (var key in context) {
            parsedpath.dirname = replaceAll(parsedpath.dirname, `__${key}__`, context[key]);
            parsedpath.basename = replaceAll(parsedpath.basename, `__${key}__`, context[key]);
            parsedpath.extname = replaceAll(parsedpath.extname, `__${key}__`, context[key]);
        }
    }

    function replaceAll(str : string, find: string, replaceWith : string) {
        return str.split(find).join(replaceWith);
    }
}

module.exports = Raft;
