import { Architecture, Platform } from "../core/build-config";
import { raftCMakeDir } from "../core/cmake";
import { Flag, RAFT_FLAGS } from "../core/flags";

export class iOSPlatform extends Platform {
  name: string = "iOS";

  getArchitectures(): iOSArchitecture[] {
    return [
      "i386",
      "x86_64",
      "armv7",
      "armv7s",
      "arm64",
      "all-os",
      "all-sim",
    ].map((name) => new iOSArchitecture(name));
  }
}

class iOSArchitecture extends Architecture {
  constructor(public name: string) {
    super();
  }

  getCMakeFlags(isRelease: boolean): Flag[] {
    return [
      { name: RAFT_FLAGS.IS_DESKTOP, value: RAFT_FLAGS.FALSE },
      { name: RAFT_FLAGS.IS_MACOS, value: RAFT_FLAGS.FALSE },
      { name: RAFT_FLAGS.IS_ANDROID, value: RAFT_FLAGS.FALSE },
      { name: RAFT_FLAGS.IS_IOS, value: RAFT_FLAGS.TRUE },
      { name: RAFT_FLAGS.ARCH, value: this.name },
      {
        name: RAFT_FLAGS.CMAKE_TOOLCHAIN,
        value: raftiOSToolchainFile().toString(),
      },
    ];
  }

  buildOptions(): string[] {
    let archs: string[];
    if (this.name === "all-os") {
      archs = ["-arch", "arm64", "-arch", "armv7"];
    } else if (this.name === "all-sim") {
      archs = ["-arch", "i386", "-arch", "x86_64"];
    } else {
      archs = ["-arch", this.name];
    }
    return archs.concat([
      "-sdk",
      this._getSDKType(),
      "BITCODE_GENERATION_MODE=bitcode",
      "OTHER_CFLAGS=-fembed-bitcode",
    ]);
  }

  getCMakeGeneratorTarget(): string | null {
    return "Xcode";
  }

  private _getSDKType(): string {
    switch (this.name) {
      case "i386":
      case "x86_64":
      case "all-sim":
        return "iphonesimulator";
      case "armv7":
      case "armv7s":
      case "arm64":
      case "all-os":
      default:
        return "iphoneos";
    }
  }
}

function raftiOSToolchainFile() {
  return raftCMakeDir().append("toolchains", "iOS", "iOS.toolchain.cmake");
}
