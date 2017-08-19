import {Build, Platform, Architecture} from '../core/build-config';
import {Flag, RAFT_FLAGS} from '../core/flags';
import {raftCMakeDir} from '../core/cmake';

export class iOSPlatform extends Platform {
    name : string = "iOS";

    getArchitectures() : iOSArchitecture[] {
        return [
            "armeabi"
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
            {name : RAFT_FLAGS.IS_ANDROID, value: RAFT_FLAGS.FALSE},
            {name : RAFT_FLAGS.IS_IOS, value: RAFT_FLAGS.TRUE},
            {name : RAFT_FLAGS.CMAKE_TOOLCHAIN, value: raftiOSToolchainFile().toString()},
        ]
    }

    getCMakeGeneratorTarget() : string | null {
        return "Xcode";
    }
}

function raftiOSToolchainFile() {
    return raftCMakeDir().append("toolchains","iOS","iOS.toolchain.cmake");
}