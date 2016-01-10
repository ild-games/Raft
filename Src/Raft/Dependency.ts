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
        build(project : Project, build : BuildConfig.Build) : Promise<any>;
        install(project : Project, build : BuildConfig.Build) : Promise<any>;
    }


    export class RepositoryDependency implements Dependency {
        name : string;
        repository : VCS.Repository;

        constructor(name : string, repo : VCS.Repository) {
            this.name = name;
            this.repository = repo;
        }

        download(project : Project, build : BuildConfig.Build) : Promise<any> {
            return this.repository.download(project.dirForDependency(this));
        }

        build(project : Project, build : BuildConfig.Build) : Promise<any> { return null };
        install(project : Project, build : BuildConfig.Build) : Promise<any> { return null };
    }

    export class CMakeDependency extends RepositoryDependency {
        build(project : Project, build : BuildConfig.Build) : Promise<any> {
            var sourceLocation = project.dirForDependency(this);
            var buildLocation = project.dirForDependencyBuild(this, build);
            var installLocation = project.dirForDependencyInstall(build);
            var cmakeOptions = { CMAKE_INSTALL_PREFIX : installLocation.toString()};

            return CMake.configure(sourceLocation, buildLocation, cmakeOptions)
            .then(() => {
                return CMake.build(buildLocation);
            });
        }

        install(project : Project, build : BuildConfig.Build) : Promise<any> {
            return CMake.install(project.dirForDependencyBuild(this, build));
        }
    }


    export function createDependency(dependencyDescriptor : RaftFile.DependencyDescriptor) {
        var repo = createRepository(dependencyDescriptor.repository);
        if (dependencyDescriptor.buildSystem === "cmake") {
            console.log("Creating a dependency");
            return new CMakeDependency(dependencyDescriptor.name, repo);
        } else {
            throw Error("unknown build system type");
        }
    }

    export function createRepository(repoDescriptor : RaftFile.RepositoryDescriptor) : VCS.Repository {
        if (repoDescriptor.type) {
            return new VCS.GitRepository(repoDescriptor.location);
        } else {
            throw Error("Unknown repository type");
        }
    }

    export function getDependency(project : Project, build : BuildConfig.Build, dependency : Dependency) {
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
}
export = Dependency;
