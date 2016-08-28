import * as Promise from 'bluebird';

import {Build, Architecture} from '../build-config';
import {Project} from '../project';
import {Path} from '../path';

const STL_DIR_NAME = new Path("llvm-libc++");
const STL_LIB_NAME = new Path("libc++_shared.so");

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
