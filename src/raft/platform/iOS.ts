import {Build, Platform, Architecture} from '../core/build-config';
import {Flag, RAFT_FLAGS} from '../core/flags';

export class iOSPlatform extends Platform {
    name : string = "iOS";

    getArchitectures() : iOSArchitecture[] {
        return [

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
            {name : RAFT_FLAGS.IS_IOS, value: RAFT_FLAGS.TRUE}
        ]
    }
}