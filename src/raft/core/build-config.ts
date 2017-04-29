import {Project} from './project';
import {Flag} from './flags';

/**
 * Defines the variables available when configuring a specific build.
 */
export interface Build {
    platform : Platform;
    architecture : Architecture;
    releaseBuild : boolean;
}


/**
 * Represents a specific target platform. Each platform can have multiple architectures.
 * For example Android is a platform and armabi is an architecture.
 */
export interface Platform {
    name : string;
    getArchitectures() : Architecture [];
}

/**
 * Represents a specific target architecture. Example x86 vs x64. Each architecture is
 * unique to a platform. Android x86 has different build rules than Windows x86.
 */
export abstract class Architecture {
    abstract name : string;

    beforeBuild(project : Project, buildConfig : Build) : Promise<any> {
        return Promise.resolve();
    }

    getCMakeFlags() : Flag[] {
        return [];
    }
}
