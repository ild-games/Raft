import {Build, Platform, Architecture} from '../core/build-config';
import {Flag, RAFT_FLAGS} from '../core/flags';
import {Path} from '../core/path';
import {Project} from '../core/project';
import {raftCMakeDir} from '../core/cmake';

const STL_DIR_NAME = new Path("llvm-libc++");
const STL_LIB_NAME = new Path("libc++_shared.so");

//Android CMake Options

/**
 * Get the path to the root of the NDK.
 */
export function findNDK() : Path {
    return new Path(process.env.ANDROID_NDK);
}

export class AndroidPlatform extends Platform {
    name : string = "Android";

    getArchitectures() : AndroidArchitecture[] {
        return [
            "armeabi",
            "armeabi-v7a",
            "arm64-v8a",
            "x86",
            "x86_64",
            "mips",
            "mips64"
        ].map(name => new AndroidArchitecture(name));
    }
}

class AndroidArchitecture extends Architecture {
    constructor(public name : string) {
        super();
    }

    beforeBuild(project : Project, buildConfig : Build) : Promise<any> {
        var stlPath = this.getStlPath();
        var libPath = project.dirForDependencyLib(buildConfig)
        return stlPath.copyTo(libPath.append(STL_LIB_NAME));
    }

    getCMakeFlags() : Flag[]{
        return [
            {name : RAFT_FLAGS.IS_DESKTOP, value: RAFT_FLAGS.FALSE},
            {name : RAFT_FLAGS.IS_ANDROID, value: RAFT_FLAGS.TRUE},
            {name : RAFT_FLAGS.CMAKE_TOOLCHAIN, value: raftAndroidToolchainFile().toString()},
            {name : "ANDROID_ABI", value: this.name},
            {name : "ANDROID_STL", value: "c++_shared"},
            {name : "ANDROID_NATIVE_API_LEVEL", value: "android-9"}
        ]
    }

    private getStlPath() {
        return findNDK().append(
            "sources",
            "cxx-stl",
            STL_DIR_NAME,
            "libs",
            this.name,
            STL_LIB_NAME
        );
    }
}

/**
* Get the path to the Android Toolchain file.
* @return {Path} Path to the Android toolchain file.
*/
export function raftAndroidToolchainFile() {
    return raftCMakeDir().append("toolchains","android","android.toolchain.cmake");
}
