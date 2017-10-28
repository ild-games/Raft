import {Build, Platform, Architecture} from '../core/build-config';
import {Flag, RAFT_FLAGS} from '../core/flags';
import {raftCMakeDir} from '../core/cmake';

export class iOSPlatform extends Platform {
    name : string = "iOS";

    getArchitectures() : iOSArchitecture[] {
        return [
            "i386",
            "x86_64",
            "armv7",
            "armv7s",
            "arm64"
        ].map(name => new iOSArchitecture(name));
    }
}

class iOSArchitecture extends Architecture {
    constructor(public name : string) {
        super();
    }

    getCMakeFlags() : Flag[] {
        return [
            {name : RAFT_FLAGS.IS_DESKTOP, value: RAFT_FLAGS.FALSE},
            {name : RAFT_FLAGS.IS_MACOS, value: RAFT_FLAGS.FALSE},
            {name : RAFT_FLAGS.IS_ANDROID, value: RAFT_FLAGS.FALSE},
            {name : RAFT_FLAGS.IS_IOS, value: RAFT_FLAGS.TRUE},
            {name : RAFT_FLAGS.ARCH, value: this.name},
            {name : RAFT_FLAGS.CMAKE_TOOLCHAIN, value: raftiOSToolchainFile().toString()}
        ]
    }

    buildOptions() : string[] {
        return [
            '-sdk',
            this._getSDKType(),
            '-arch',
            this.name
        ];
    }

    getCMakeGeneratorTarget() : string | null {
        return "Xcode";
    }

    private _getSDKType() : string {
        switch (this.name) {
            case "i386":
            case "x86_64":
                return "iphonesimulator";
            case "armv7":
            case "armv7s":
            case "arm64":
            default:
                return "iphoneos";
        }
    }
}

function raftiOSToolchainFile() {
    return raftCMakeDir().append("toolchains","iOS","iOS.toolchain.cmake");
}
