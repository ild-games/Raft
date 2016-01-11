import _ = require('underscore');

import Path = require('./Path');
import System = require('./System');

module CMake {
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

export = CMake
