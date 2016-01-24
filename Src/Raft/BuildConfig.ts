/**
 * Defines the variables available when configuring a specific build.
 */
export interface Build {
    platform : Platform;
    architecture : string;
    isDeploy : boolean;
}

export enum Platform {
    Host
}
