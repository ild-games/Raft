import * as colors from "colors";
import { Build } from "./build-config";
import { CMakeBuild, CMakeOptions } from "./cmake";
import { raftlog } from "./log";
import { Path } from "./path";
import { Project } from "./project";
import { DependencyDescriptor } from "./raft-file-descriptor";
import { Repository } from "./vcs";

/**
 * Interface used to interact with a build dependency.
 */
export interface Dependency {
  /**
   * The name of the dependency.  Must be unique in a build.
   */
  name: string;

  /**
   * Patches that are applied to the dependency.
   */
  patches: Path[];

  /**
   * Download the source and binaries used by the dependency.
   * @param  project Root raft project that is being built.
   * @param  build   Configuration for the current build.
   * @return A promise that resolves once the download is finished.
   */
  download(project: Project, build: Build): Promise<any>;

  /**
   * Build the dependency and install it so that it is accessible to other dependencies
   * and the root project.
   * @param rootProject Root raft project that is being built.
   * @param build   Configuration for the current build.
   * @param project Raft project that is being built, might be same as root
   * @return A promise that resolves once the project is built and installed.
   */
  buildInstall(
    project: Project,
    build: Build,
    rootProject?: Project
  ): Promise<any>;
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
  constructor(
    public descriptor: DependencyDescriptor,
    public repository: Repository,
    public patches: Path[]
  ) {}

  /**
   * @see Dependency.Dependency.download
   */
  async download(project: Project, build: Build): Promise<any> {
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
  buildInstall(
    rootProject: Project,
    build: Build,
    project?: Project
  ): Promise<any> {
    return null;
  }

  get name() {
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
  async buildInstall(
    rootProject: Project,
    build: Build,
    project?: Project
  ): Promise<any> {
    var sourceLocation = rootProject.dirForDependency(this.name);
    var buildLocation = rootProject.dirForDependencyBuild(this.name, build);
    var installLocation = rootProject.dirForDependencyInstall(build);
    var cmakeOptions = CMakeOptions.create(installLocation)
      .isReleaseBuild(build.releaseBuild)
      .isDistributableBuild(build.distributable)
      .architecture(build.architecture, build.releaseBuild)
      .configOptions(this.descriptor.configOptions)
      .raftIncludeDir(rootProject.dirForDependencyInc(build))
      .raftLibDir(rootProject.dirForDependencyLib(build))
      .raftInstallDir(rootProject.dirForDependencyInstall(build));

    if (project) {
      const cmakeModulePath = project.root.append("cmake/modules");
      console.log(
        `Dependency is itself RAFT PROJECT, here is its possible cmake module path!: ${cmakeModulePath}`
      );
      if (cmakeModulePath.exists()) {
        cmakeOptions = cmakeOptions.cmakeModulePath(cmakeModulePath);
      }
    } else {
      const cmakeModulePath = rootProject.root.append("cmake/modules");
      console.log(
        `Dependency is not a RAFT PROJECT, here is its root RAFT PROJECT possible cmake module path!: ${cmakeModulePath}`
      );
      if (cmakeModulePath.exists()) {
        cmakeOptions = cmakeOptions.cmakeModulePath(cmakeModulePath);
      }
    }

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
export function getDependency(
  project: Project,
  build: Build,
  dependency: Dependency
) {
  let dependencyTagColorFunc = colors.bgCyan.bold;
  raftlog(dependency.name, "Downloading", dependencyTagColorFunc);
  return dependency
    .download(project, build)
    .then(() => {
      raftlog(dependency.name, "Building", dependencyTagColorFunc);
      return dependency.buildInstall(project, build);
    })
    .then(() => {
      raftlog(dependency.name, "Ready", dependencyTagColorFunc);
    });
}

/**
 * A dependency that uses Raft for managing its own dependencies.
 */
export class RaftDependency extends RepositoryDependency {
  constructor(
    public descriptor: DependencyDescriptor,
    public repository: Repository,
    public patches: Path[],
    private _createDependency: (
      descriptor: DependencyDescriptor,
      raftDir: Path
    ) => Dependency
  ) {
    super(descriptor, repository, patches);
  }

  private project: Project;

  /**
   * @see Dependency.download
   */
  download(project: Project, build: Build): Promise<any> {
    var buildLocation = project.dirForDependency(this.name);
    return super
      .download(project, build)
      .then(() => Project.find(buildLocation))
      .then((thisProject) => {
        this.project = thisProject;

        if (this.project.root.equals(project.root)) {
          throw Error(`The Dependency ${this.name} is not a raft dependency`);
        }

        var dependencies = this.project
          .dependencies()
          .map((dependency) =>
            this._createDependency(dependency, this.project.raftDir)
          );

        return Promise.all(
          dependencies.map((dependency) => dependency.download(project, build))
        );
      });
  }

  /**
   * @see Dependency.buildInstall
   */
  async buildInstall(rootProject: Project, build: Build): Promise<any> {
    var buildPath = rootProject.dirForDependencyBuild(this.name, build);
    var dependencies = this.project
      .dependencies()
      .map((dependency) =>
        this._createDependency(dependency, rootProject.raftDir)
      );

    for (let dependency of dependencies) {
      await dependency.buildInstall(rootProject, build, this.project);
    }

    var options = this.project.cmakeOptions(rootProject, build);
    options = options.configOptions(this.descriptor.configOptions || []);
    let cmakeBuild = new CMakeBuild(buildPath, build);

    await cmakeBuild.configure(this.project.root, options);
    await cmakeBuild.build();
    await cmakeBuild.install();
  }
}
