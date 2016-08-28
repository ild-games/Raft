import Promise = require('bluebird');

import Project = require('../project');
import Path = require('../path');

const STL_DIR_NAME = new Path("llvm-libc++");
const STL_LIB_NAME = new Path("libc++_shared.so");

import {Build, Architecture} from '../build-config';

/**
 * Hook executed before the project is built. Android uses this hook to install
 * the stl into the libs directory.
 */
export function androidBeforeBuild(project : Project, buildConfig : Build) : Promise<any> {
    var stlPath = getStlPath(buildConfig.architecture);
    var libPath = project.dirForDependencyLib(buildConfig)
    return stlPath.copyTo(libPath.append(STL_LIB_NAME));
}

/**
 * Get the path to the root of the NDK.
 */
export function findNDK() : Path {
    return new Path(process.env.ANDROID_NDK);
}

/**
 * Get the path to the NDK's shared library.
 */
export function getStlPath(architecture: Architecture) : Path {
    return findNDK().append(
        "sources",
        "cxx-stl",
        STL_DIR_NAME,
        "libs",
        Architecture[architecture],
        STL_LIB_NAME
        );
}
