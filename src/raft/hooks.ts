/**
 * This file is currently a little sparse, but it will eventually contain hooks for
 * different parts of the build process. The hooks will be used for project specific
 * scripts and as a way to handle platform specific quirks.
 */
 
import Project = require('./project');

import {androidBeforeBuild} from './platform/android';
import {Build, Platform} from './build-config';

/**
 * Function that is executed before the primary raft project is build.
 * @param  project Primary raft project.
 * @param  buildConfig The configuration for the current build.
 * @return A promise that resolves once the hook is finished executing.
 */
export function beforeBuild(project : Project, buildConfig: Build) : Promise<any> {
    switch (buildConfig.platform) {
        case Platform.Android:
            return androidBeforeBuild(project, buildConfig);
    }
    return Promise.resolve();
}
