import _ = require('underscore');

import Path = require('./Path');
import System = require('./System');

module CMake {
    /**
     * Configure a cmake project.
     * @param  {Path}         srcPath   Root of the cmake project.
     * @param  {Path}         buildPath Directory the configuration was stored in.
     * @param  {any}          options   Set of Key Values that will be passed to CMake as configuration options.
     * @return {Promise<any>}           Promise that resolves once the cmake configuration is complete.
     */
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

    /**
     * Build the cmake project that was configured into the build path.
     * @param  {Path}   buildPath Path the cmake project was configured into.
     * @return {Promise<any>}     Promise that resolves once the build is finished.
     */
    export function build(buildPath : Path) : Promise<any> {
        return System.execute(`make -j8`, {cwd : buildPath});
    }

    /**
     * Install a built cmake project.
     * @param  {Path}   buildPath Location of a built cmake project.
     * @return {Promise<any>}     Promise that resolves once the install is completed.
     */
    export function install(buildPath : Path) {
        return System.execute(`make install`, {cwd : buildPath});
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
}

export = CMake
