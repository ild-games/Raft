import {Build, Platform, Architecture} from '../core/build-config';
import {Flag, RAFT_FLAGS} from '../core/flags';

export class HostPlatform implements Platform {
    name : string = "Host";

    constructor() {

    }

    getArchitectures() : HostArchitecture[] {
        return [new HostArchitecture()];
    }
}

export class HostArchitecture extends Architecture {
    name : string = "Host";

    getCMakeFlags() : Flag [] {
        return [
            {name : RAFT_FLAGS.IS_DESKTOP, value: RAFT_FLAGS.TRUE},
            {name : RAFT_FLAGS.IS_ANDROID, value: RAFT_FLAGS.FALSE}
        ]
    }
}
