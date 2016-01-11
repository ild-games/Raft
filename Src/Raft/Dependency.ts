import _ = require('underscore');

import BuildConfig = require('./BuildConfig')
import CMake = require('./CMake')
import Project = require('./Project')
import Path = require('./Path')
import RaftFile = require('./RaftFile')
import VCS = require('./VCS')

import raftlog = require('./Log')

module Dependency {
    export interface Dependency {
        name : string;
        download(project : Project, build : BuildConfig.Build) : Promise<any>;
        buildInstall(project : Project, build : BuildConfig.Build) : Promise<any>;
    }


    export class RepositoryDependency implements Dependency {
        name : string;
        repository : VCS.Repository;

        constructor(name : string, repo : VCS.Repository) {
            this.name = name;
            this.repository = repo;
        }

        download(project : Project, build : BuildConfig.Build) : Promise<any> {
            return this.repository.download(project.dirForDependency(this.name));
        }

        buildInstall(project : Project, build : BuildConfig.Build) : Promise<any> { return null };
    }

    export class CMakeDependency extends RepositoryDependency {
        buildInstall(project : Project, build : BuildConfig.Build) : Promise<any> {
            var sourceLocation = project.dirForDependency(this.name);
            var buildLocation = project.dirForDependencyBuild(this.name, build);
            var installLocation = project.dirForDependencyInstall(build);
            var cmakeOptions = { CMAKE_INSTALL_PREFIX : installLocation.toString()};

            return CMake.configure(sourceLocation, buildLocation, cmakeOptions)
            .then(() => {
                return CMake.build(buildLocation);
            }).then(() => {
                return CMake.install(buildLocation);
            });
        }
    }

    export class RaftDependency extends RepositoryDependency {
        private project : Project;

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

        buildInstall(project : Project, build : BuildConfig.Build) : Promise<any> {
            var buildPath = project.dirForDependencyBuild(this.name, build);
            return Promise.all(_.map(
                _.map(this.project.dependencies(), createDependency),
                (dependency) => dependency.buildInstall(project, build)
            )).then(() => {
                var options = this.project.cmakeOptions(project, build);
                options["CMAKE_INSTALL_PREFIX"] = project.dirForDependencyInstall(build);
                return CMake.configure(this.project.root, buildPath, options);
            }).then(() => {
                return CMake.build(buildPath);
            }).then(() => {
                return CMake.install(buildPath);
            })
        };
    }

    export function createDependency(dependencyDescriptor : RaftFile.DependencyDescriptor) {
        var repo = createRepository(dependencyDescriptor.repository);
        var buildSystem = dependencyDescriptor.buildSystem;
        if (buildSystem === "cmake") {
            return new CMakeDependency(dependencyDescriptor.name, repo);
        } else if (buildSystem === "raft") {
            return new RaftDependency(dependencyDescriptor.name, repo);
        } else {
            throw Error("unknown build system type");
        }
    }

    export function createRepository(repoDescriptor : RaftFile.RepositoryDescriptor) : VCS.Repository {
        console.log("Repo Branch: " + repoDescriptor.branch);
        if (repoDescriptor.type) {
            return new VCS.GitRepository(repoDescriptor.location, repoDescriptor.branch);
        } else {
            throw Error("Unknown repository type");
        }
    }

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
}
export = Dependency;
