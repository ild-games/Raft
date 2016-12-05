/**
 * Defines the variables available when configuring a specific build.
 */
export interface Build {
    platform : Platform;
    architecture : Architecture;
    releaseBuild : boolean;
}

export enum Platform {
    Host,
    Android
}

export enum Architecture {
    Host,
    armeabi
}

/**
 * Given the platform and architecture parse out the BuildConfig.
 * @param  platform A string describing the platform.
 * @param  architecture A string describing the architecture.
 * @return The Build configuration to use.
 */
export function parseBuildConfig(platform? : string, architecture? : string, release? : boolean) : Build {
    if (platform && platform.toUpperCase() === "ANDROID") {
        return {
            releaseBuild : !!release,
            platform : Platform.Android,
            architecture : Architecture.armeabi
        }
    } else {
        return {
            releaseBuild : !!release,
            platform : Platform.Host,
            architecture : Architecture.Host
        }
    }
}
