import { Architecture, Platform } from "../core/build-config";
import { Flag, RAFT_FLAGS } from "../core/flags";

export class HostPlatform extends Platform {
  name: string = "Host";

  getArchitectures(): HostArchitecture[] {
    return [new HostArchitecture()];
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
