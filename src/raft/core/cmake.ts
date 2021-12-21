import * as _ from "underscore";
import { Architecture, Build } from "./build-config";
import { Flag, RAFT_FLAGS } from "./flags";
import { Path } from "./path";
import { execute, ProcessOutput } from "./system";

export const FRAMEWORK_DIR = "framework";

//CMake Constants
const CMAKE_TRUE = "true";
const CMAKE_FALSE = "false";

//CMake Options
const CMAKE_INSTALL_PREFIX = "CMAKE_INSTALL_PREFIX";
const CMAKE_INSTALL_FRAMEWORK_PREFIX = "CMAKE_INSTALL_FRAMEWORK_PREFIX";
const CMAKE_TOOLCHAIN = "CMAKE_TOOLCHAIN_FILE";

//Raft CMake Options
const RAFT = "RAFT";

export class CMakeBuild {
  /*
   * Create an object that controls a CMakeBuild
   * @param  {Path}          buildPath Directory the configuration was stored in.
   */
  constructor(private _buildPath: Path, private _buildConfig: Build) {}

  /**
   * Configure a cmake project.
   * @param  {Path}          srcPath   Root of the cmake project.
   * @param  {CMakeOptions}  options   The options that will be used for the build.
   * @return {Promise<any>}            Promise that resolves once the cmake configuration is complete.
   */
  configure(sourcePath: Path, options: CMakeOptions): Promise<any> {
    const cmakeOptions = [sourcePath.toString()].concat(options.toArray());
    const cmakeGenerator = this._buildConfig.platform.getCMakeGeneratorTarget();
    const cmakeGeneratorOptions = cmakeGenerator ? ["-G", cmakeGenerator] : [];
    const platformOptions = this.platformSpecificBuildOptions();

    const cmdOptions = [
      ...cmakeGeneratorOptions,
      ...cmakeOptions,
      ...platformOptions,
    ];
    return execute("cmake", cmdOptions, { cwd: this._buildPath });
  }

  /**
   * Build the cmake project that was configured into the build path.
   * @return {Promise<any>}     Promise that resolves once the build is finished.
   */
  build(): Promise<ProcessOutput> {
    let type = this._buildConfig.releaseBuild ? "Release" : "Debug";
    let buildOptions = this._buildConfig.architecture.buildOptions();
    let cmakeOptions = [
      `--build`,
      this._buildPath.toString(),
      "--config",
      type,
    ];
    cmakeOptions = [
      ...cmakeOptions,
      ...this._buildConfig.platform.getCMakeBuildOptions(),
    ];
    buildOptions = [...this.platformSpecificBuildOptions(), ...buildOptions];
    if (buildOptions.length > 0) {
      cmakeOptions = [...cmakeOptions, "--", ...buildOptions];
    }
    return execute("cmake", cmakeOptions);
  }

  /**
   * Install a built cmake project.
   * @return {Promise<any>}     Promise that resolves once the install is completed.
   */
  install(): Promise<ProcessOutput> {
    let type = this._buildConfig.releaseBuild ? "Release" : "Debug";
    let buildOptions = this._buildConfig.architecture.buildOptions();
    let cmakeOptions = [
      `--build`,
      this._buildPath.toString(),
      "--config",
      type,
      "--target",
      "install",
    ];
    if (buildOptions.length > 0) {
      cmakeOptions = [...cmakeOptions, "--", ...buildOptions];
    }
    return execute("cmake", cmakeOptions, { cwd: this._buildPath });
  }

  private platformSpecificConfigureOptions(): string[] {
    return [];
  }

  private platformSpecificBuildOptions(): string[] {
    return [];
  }
}

/**
 * Used for specifying the configuration of a CMake build. This class implements
 * the builder pattern. Required arguments are placed in the constructor. The
 * CMakeOptions class is immutable.
 */
export class CMakeOptions {
  private options: { [key: string]: string } = {};

  /**
   * Static factory that should be used for creating a CMakeOptions.
   * @param  {Path}   installDir Directory where the project should be installed.
   * @return {CMakeOptions} CMakeOptions with the install prefixes set.
   */
  static create(installDir: Path) {
    var result = new CMakeOptions();
    result = result.setPath(CMAKE_INSTALL_PREFIX, installDir);
    result = result.setPath(
      CMAKE_INSTALL_FRAMEWORK_PREFIX,
      installDir.append(FRAMEWORK_DIR)
    );
    return result.setPath(RAFT, raftCmakeFile());
  }

  /**
   * Use the static create factory method instead of the constructor.
   */
  constructor() {}

  /**
   * Set the include path for the build.
   * @param  path Path that will be used to include header files.
   * @return New CMakeOptions with the include directory modified.
   */
  raftIncludeDir(path: Path): CMakeOptions {
    return this.setPath(RAFT_FLAGS.INCLUDE_DIR, path);
  }

  /**
   * Set the path to search for library files.
   * @param  path Path that will be used to include libraries.
   * @return New CMakeOptions with the lib path modified.
   */
  raftLibDir(path: Path): CMakeOptions {
    return this.setPath(RAFT_FLAGS.LIB_DIR, path);
  }

  /**
   * Set the path to search for dependency install files.
   * @param  path Path where dependencies are installed to.
   * @return New CMakeOptions with the install path modified.
   */
  raftInstallDir(path: Path): CMakeOptions {
    return this.setPath(RAFT_FLAGS.INSTALL_DIR, path);
  }

  /**
   * Set the path that should be used to search for framework dependencies.
   * @param  path Path that should be used to find framework dependencies.
   * @return New CMakeOptios with the framework dependencies set.
   */
  raftFrameworkDir(path: Path): CMakeOptions {
    return this.setPath(RAFT_FLAGS.FRAMEWORK_DIR, path);
  }

  /**
   * Configure CMake as a release or debug build.
   * @param  isRelease True if it is a release build. False if it is a debug build.
   * @return CMakeOptions with release or debug flags set.
   */
  isReleaseBuild(isRelease: boolean): CMakeOptions {
    let copy = this.clone();
    copy.options["CMAKE_BUILD_TYPE"] = isRelease ? "RELEASE" : "DEBUG";
    return copy;
  }

  cmakeModulePath(path?: Path): CMakeOptions {
    return this.setPath("CMAKE_MODULE_PATH", path);
  }

  /**
   * Configure CMake as a distributable build or not
   * @param  isRelease True if it is a distributable build. False if not.
   * @return CMakeOptions with release or debug flags set.
   */
  isDistributableBuild(isDistributable: boolean): CMakeOptions {
    let copy = this.clone();
    copy.options["RAFT_DISTRIBUTABLE"] = isDistributable
      ? RAFT_FLAGS.TRUE
      : RAFT_FLAGS.FALSE;
    return copy;
  }

  /**
   * Configure platform specific build flags.
   * @param platform Platform that is being built.
   * @return CMakeOptions with platform specific flags set.
   */
  architecture(architecture: Architecture, isRelease: boolean): CMakeOptions {
    let result = this.clone();
    for (let flag of architecture.getCMakeFlags(isRelease)) {
      result.options[flag.name] = flag.value;
    }
    return result;
  }

  /**
   * Set the configuration options passed in from the RaftFile configuration.
   * @param flags Array of flags that were set in the RaftFile.
   */
  configOptions(flags: Flag[] = []) {
    var result = this.clone();
    for (var flag of flags) {
      result.options[flag.name] = flag.value;
    }
    return result;
  }

  /**
   * Return an array of arguments that can be passed to a cmake command.
   * @return {string} Options set as CMake flags.
   */
  toArray(): string[] {
    return _.map(_.pairs(this.options), (option: string[]) => {
      return `-D${option[0]}=${option[1]}`;
    });
  }

  private setPath(key: string, value: Path) {
    var result = this.clone();
    result.options[key] = Path.convertToUnixLike(value).toString();
    return result;
  }

  private clone() {
    var result = new CMakeOptions();
    result.options = _.clone(this.options);
    return result;
  }
}

/**
 * Get the directory Raft uses to store CMake files.
 * @return {Path} Path the cmake files are stored in.
 */
export function raftCMakeDir(): Path {
  return new Path(__dirname)
    .parent()
    .parent()
    .parent()
    .parent()
    .append("cmake");
}

/**
 * Get the path to the Raft CMake file used to configure the build to pull
 * dependencies and modules from the right locations.
 *
 * This is the file that Raft projects include at the start of their root CMakeLists.txt.
 * EX: include(${RAFT})
 *
 * @return {Path} Path to the raft cmake file.
 */
export function raftCmakeFile() {
  return raftCMakeDir().append("raft.cmake");
}
