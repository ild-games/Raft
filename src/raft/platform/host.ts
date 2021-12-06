import * as os from "os";
import { Architecture, Platform } from "../core/build-config";
import { Path } from "../core/path";
import { Flag, RAFT_FLAGS } from "../core/flags";

export class HostPlatform extends Platform {
  name: string = "Host";

  getArchitectures(): HostArchitecture[] {
    return [new HostArchitecture()];
  }

  getCMakeGeneratorTarget(): string | null {
    if (os.platform() === "win32") {
      return "Visual Studio 17 2022";
    }
    return null;
  }

  getBuildSymbolPattern(buildType: "Debug" | "Release"): string {
    if (os.platform() === "win32") {
      return `.${Path.folderSeparator()}${buildType}${Path.folderSeparator()}`;
    }
  }
}

export class HostArchitecture extends Architecture {
  name: string = "Host";

  getCMakeFlags(isRelease: boolean): Flag[] {
    return [
      { name: RAFT_FLAGS.IS_DESKTOP, value: RAFT_FLAGS.TRUE },
      { name: RAFT_FLAGS.IS_MACOS, value: RAFT_FLAGS.FALSE },
      { name: RAFT_FLAGS.IS_ANDROID, value: RAFT_FLAGS.FALSE },
      { name: RAFT_FLAGS.IS_IOS, value: RAFT_FLAGS.FALSE },
      { name: RAFT_FLAGS.ARCH, value: this.name },
    ];
  }
}
