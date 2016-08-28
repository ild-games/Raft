/**
 * Defines the variables available when configuring a specific build.
 */
export interface Build {
    platform : Platform;
    architecture : Architecture;
    isDeploy : boolean;
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
export function parseBuildConfig(platform? : string, architecture? : string) : Build {
    if (platform && platform.toUpperCase() === "ANDROID") {
        return {
            isDeploy : false,
            platform : Platform.Android,
            architecture : Architecture.armeabi
        }
    } else {
        return {
            isDeploy : false,
            platform : Platform.Host,
            architecture : Architecture.Host
        }
    }
}
