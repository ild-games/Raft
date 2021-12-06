import { Architecture, Build, Platform } from "../core/build-config";
import { Flag, RAFT_FLAGS } from "../core/flags";
import { Path } from "../core/path";
import { Project } from "../core/project";

const STL_DIR_NAME = new Path("llvm-libc++");
const STL_LIB_NAME = new Path("libc++_shared.so");

//Android CMake Options

/**
 * Get the path to the root of the NDK.
 */
export function findNDK(): Path {
  return new Path(process.env.ANDROID_NDK);
}

export class AndroidPlatform extends Platform {
  name: string = "Android";

  getArchitectures(): AndroidArchitecture[] {
    return [
      "armeabi",
      "armeabi-v7a",
      "arm64-v8a",
      "x86",
      "x86_64",
      "mips",
      "mips64",
    ].map((name) => new AndroidArchitecture(name));
  }
}

class AndroidArchitecture extends Architecture {
  constructor(public name: string) {
    super();
  }

  beforeBuild(project: Project, buildConfig: Build): Promise<any> {
    var stlPath = this.getStlPath();
    var libPath = project.dirForDependencyLib(buildConfig);
    return stlPath.copyTo(libPath.append(STL_LIB_NAME));
  }

  getCMakeFlags(isRelease: boolean): Flag[] {
    return [
      { name: RAFT_FLAGS.IS_DESKTOP, value: RAFT_FLAGS.FALSE },
      { name: RAFT_FLAGS.IS_MACOS, value: RAFT_FLAGS.FALSE },
      { name: RAFT_FLAGS.IS_IOS, value: RAFT_FLAGS.FALSE },
      { name: RAFT_FLAGS.IS_ANDROID, value: RAFT_FLAGS.TRUE },
      { name: RAFT_FLAGS.ARCH, value: this.name },
      {
        name: RAFT_FLAGS.CMAKE_TOOLCHAIN,
        value: raftAndroidToolchainFile().toString(),
      },
      { name: "ANDROID_ABI", value: this.name },
      { name: "ANDROID_STL", value: "c++_shared" },
      { name: "ANDROID_NATIVE_API_LEVEL", value: "android-21" },
      { name: "CMAKE_ANDROID_NDK_TOOLCHAIN_VERSION", value: "clang" },
      { name: "CMAKE_SYSTEM_NAME", value: "Android" },
      { name: "CMAKE_ANDROID_NDK", value: findNDK().toString() },
    ];
  }

  private getStlPath() {
    return findNDK().append(
      "sources",
      "cxx-stl",
      STL_DIR_NAME,
      "4.9",
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
  return findNDK().append("build", "cmake", "android.toolchain.cmake");
}
