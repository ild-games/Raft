import _ = require('underscore');

import BuildConfig = require('./BuildConfig');
import Path = require('./Path');
import System = require('./System');

module CMake {

    export const FRAMEWORK_DIR = "framework";

    //CMake Constants
    const CMAKE_TRUE = "true";
    const CMAKE_FALSE = "false";

    //CMake Options
    const CMAKE_INSTALL_PREFIX = "CMAKE_INSTALL_PREFIX";
    const CMAKE_INSTALL_FRAMEWORK_PREFIX = "CMAKE_INSTALL_FRAMEWORK_PREFIX";
    const CMAKE_TOOLCHAIN = "CMAKE_TOOLCHAIN_FILE";

    //Android CMake Options
    const ANDROID_ABI = "ANDROID_ABI";
    const ANDROID_STL = "ANDROID_STL";
    const ANDROID_NATIVE_API_LEVEL = "ANDROID_NATIVE_API_LEVEL";

    //Raft CMake Options
    const RAFT = "RAFT";
    const RAFT_INCLUDE_DIR = "RAFT_INCLUDE_DIR";
    const RAFT_LIB_DIR = "RAFT_LIB_DIR";
    const RAFT_FRAMEWORK_DIR = "RAFT_FRAMEWORK_DIR";
    const RAFT_IS_DESKTOP = "RAFT_IS_DESKTOP";
    const RAFT_IS_ANDROID = "RAFT_IS_ANDROID";

    /**
     * Configure a cmake project.
     * @param  {Path}          srcPath   Root of the cmake project.
     * @param  {Path}          buildPath Directory the configuration was stored in.
     * @param  {CMakeOptions}  options   The options that will be used for the build.
     * @return {Promise<any>}            Promise that resolves once the cmake configuration is complete.
     */
    export function configure(
                            srcPath : Path,
                            buildPath : Path,
                            options : CMakeOptions) : Promise<any> {

        return System.execute("cmake", [srcPath.toString()].concat(options.toArray()), {cwd : buildPath});
    }

    /**
     * Used for specifying the configuration of a CMake build. This class implements
     * the builder pattern. Required arguments are placed in the constructor. The
     * CMakeOptions class is immutable.
     */
    export class CMakeOptions {
        private options : {[key:string]:string} = {};

        /**
         * Static factory that should be used for creating a CMakeOptions.
         * @param  {Path}   installDir Directory where the project should be installed.
         * @return {CMakeOptions} CMakeOptions with the install prefixes set.
         */
        static create(installDir : Path) {
            var result = new CMakeOptions();
            result = result.setPath(CMAKE_INSTALL_PREFIX, installDir);
            result = result.setPath(CMAKE_INSTALL_FRAMEWORK_PREFIX, installDir.append(FRAMEWORK_DIR));
            return result.setPath(RAFT, raftCmakeFile());
        }

        /**
         * Use the static create factory method instead of the constructor.
         */
        constructor() {
        }

        /**
         * Set the include path for the build.
         * @param  {Path}         path Path that will be used to include header files.
         * @return {CMakeOptions}      New CMakeOptions with the include directory modified.
         */
        raftIncludeDir(path : Path) : CMakeOptions {
            return this.setPath(RAFT_INCLUDE_DIR, path);
        }

        /**
         * Set the path to search for library files.
         * @param  {Path}         path Path that will be used to include libraries.
         * @return {CMakeOptions}      New CMakeOptions with the lib path modified.
         */
        raftLibDir(path : Path) : CMakeOptions {
            return this.setPath(RAFT_LIB_DIR, path)
        }

        /**
         * Set the path that should be used to search for framework dependencies.
         * @param  {Path}         path Path that should be used to find framework dependencies.
         * @return {CMakeOptions}      New CMakeOptios with the framework dependencies set.
         */
        raftFrameworkDir(path : Path) : CMakeOptions {
            return this.setPath(RAFT_FRAMEWORK_DIR, path);
        }

        /**
         * Configure platform specific build flags.
         * @param  {BuildConfig.Platform} platform Platform that is being built.
         * @return {CMakeOptions}                  CMakeOptions with platform specific flags set.
         */
        platform(platform : BuildConfig.Platform) : CMakeOptions {
            var result = this.clone();
            switch (platform) {
                case BuildConfig.Platform.Host:
                    result.options[RAFT_IS_DESKTOP] = CMAKE_TRUE;
                    result.options[RAFT_IS_ANDROID] = CMAKE_FALSE;
                    break;
                case BuildConfig.Platform.Android:
                    result.options[RAFT_IS_DESKTOP] = CMAKE_FALSE;
                    result.options[RAFT_IS_ANDROID] = CMAKE_TRUE;
                    result.options[ANDROID_ABI] = "armeabi"; //TODO support more architectures
                    result.options[ANDROID_STL] = "gnustl_shared"; //TODO ues clang
                    result.options[ANDROID_NATIVE_API_LEVEL] = "android-18";
                    result.options[CMAKE_TOOLCHAIN] = raftAndroidToolchainFile().toString();
                    break;
                default:
                    throw Error(`Unsupported platform: ${platform}`);
            }
            return result;
        }

        /**
         * Return an array of arguments that can be passed to a cmake command.
         * @return {string} Options set as CMake flags.
         */
        toArray() : string [] {
            return  _.map(_.pairs(this.options), (option : string[]) => {
                        return `-D${option[0]}=${option[1]}`
                    });
        }

        private setPath(key : string, value : Path) {
            var result = this.clone();
            result.options[key] = value.toString();
            return result;
        }

        private clone() {
            var result = new CMakeOptions();
            result.options = _.clone(this.options);
            return result;
        }
    }

    /**
     * Build the cmake project that was configured into the build path.
     * @param  {Path}   buildPath Path the cmake project was configured into.
     * @return {Promise<any>}     Promise that resolves once the build is finished.
     */
    export function build(buildPath : Path) : Promise<any> {
        return System.execute(`make`, [`-j8`], {cwd : buildPath});
    }

    /**
     * Install a built cmake project.
     * @param  {Path}   buildPath Location of a built cmake project.
     * @return {Promise<any>}     Promise that resolves once the install is completed.
     */
    export function install(buildPath : Path) {
        return System.execute(`make`, [`install`], {cwd : buildPath});
    }

    /**
     * Get the directory Raft uses to store CMake files.
     * @return {Path} Path the cmake files are stored in.
     */
    export function raftCMakeDir() : Path {
        return (new Path(__dirname)).parent().parent().parent().append('CMake');
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
        return raftCMakeDir().append("Raft.cmake");
    }

    /**
     * Get the path to the Android Toolchain file.
     * @return {Path} Path to the Android toolchain file.
     */
    export function raftAndroidToolchainFile() {
        return raftCMakeDir().append("Toolchains", "android.toolchain.cmake");
    }
}

export = CMake
