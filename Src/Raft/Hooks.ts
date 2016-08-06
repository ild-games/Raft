import BuildConfig = require('./BuildConfig');
import Project = require('./Project');

import {androidBeforeBuild} from './Platform/Android';

export function beforeBuild(project : Project, buildConfig: BuildConfig.Build) : Promise<any> {
    switch (buildConfig.platform) {
        case BuildConfig.Platform.Android:
            return androidBeforeBuild(project, buildConfig);
    }
    return Promise.resolve();
}
