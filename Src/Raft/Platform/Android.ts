import Promise = require('bluebird');

import BuildConfig = require('../BuildConfig');
import Project = require('../Project');
import Path = require('../Path');

const STL_DIR_NAME = new Path("llvm-libc++");
const STL_LIB_NAME = new Path("libc++_shared.so");

/**
 * Hook executed before the project is built. Android uses this hook to install
 * the stl into the libs directory.
 */
export function androidBeforeBuild(project : Project, buildConfig : BuildConfig.Build) : Promise<any> {
    console.log(project);
    var stlPath = getStlPath(buildConfig.architecture);
    console.log(stlPath);
    var libPath = project.dirForDependencyLib(buildConfig)
    console.log(libPath);
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
export function getStlPath(architecture: BuildConfig.Architecture) : Path {
    return findNDK().append(
        "sources",
        "cxx-stl",
        STL_DIR_NAME,
        "libs",
        BuildConfig.Architecture[architecture],
        STL_LIB_NAME
        );
}
