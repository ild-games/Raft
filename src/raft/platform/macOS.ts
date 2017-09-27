import {Build, Platform, Architecture} from '../core/build-config';
import {Flag, RAFT_FLAGS} from '../core/flags';
import {raftCMakeDir} from '../core/cmake';

export class macOSPlatform extends Platform {
    name : string = "macOS";

    getArchitectures() : macOSArchitecture[] {
        return [new macOSArchitecture()];
    }
}

class macOSArchitecture extends Architecture {
    name : string = "Host";

    getCMakeFlags() : Flag[] {
        return [
            {name : RAFT_FLAGS.IS_DESKTOP, value: RAFT_FLAGS.TRUE},
            {name : RAFT_FLAGS.IS_ANDROID, value: RAFT_FLAGS.FALSE},
            {name : RAFT_FLAGS.IS_IOS, value: RAFT_FLAGS.FALSE},
        ]
    }

    getCMakeGeneratorTarget() : string | null {
        return "Xcode";
    }
}
