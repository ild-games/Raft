
import * as _ from 'underscore';

import * as Promptly from 'promptly';
import * as colors from 'colors';

import {Build, Platform} from './core/build-config';
import {getDependency} from './core/dependency';
import {raftlog} from './core/log';
import {Path} from './core/path';
import {Project} from './core/project';
import {instantiateTemplate} from './template';
import {createDependency, getSupportedArchitectures} from './raft-file-parser';
import {throwCommandLineError} from './core/error';

import {HostPlatform} from './platform/host';
import {AndroidPlatform} from './platform/android';

/**
 * Build the raft project the user is currently in.
 * @param  options Can be used to specify the parameters for the build configuration.
 * @return A promise that resolves once the build is finished.
 */
export async function build(options : {platform? : string, architecture? : string, release? : boolean} = {}) : Promise<any> {
    let project = await Project.find(Path.cwd());

    let dependencies = _.map(project.dependencies(), (dependency) => {
        return createDependency(dependency, project.raftDir);
    });

    let architectures = getSupportedArchitectures(project.architectures())
        .filter(arch => !options.platform|| options.platform.toUpperCase() === arch.platform.name.toUpperCase())
        .filter(arch => !options.architecture || options.architecture.toUpperCase() === arch.architecture.name.toUpperCase());

    if (architectures.length === 0) {
        throwCommandLineError("No match for the provided architecture and platform");
    }

    let buildSettings = {
        releaseBuild : !!options.release,
        platform : architectures[0].platform,
        architecture : architectures[0].architecture
    }

    raftlog("Project", `Getting ${dependencies.length} for the project`);

    await Promise.all(dependencies.map(dependency => getDependency(project, buildSettings, dependency)));

    raftlog("Project", `Running before build hooks`);
    await buildSettings.architecture.beforeBuild(project, buildSettings);

    raftlog("Project", `Running the build`);
    await project.build(buildSettings);

    raftlog("Project", `Exiting`);
}

/**
 * Create an instance of a specified template.
 * @param  {string} templateType The type of template we're creating an instance of.
 * @return {Promise<any>}        A promise that resolves when the new template instance is ready.
 */
export function create(templateType : string) : Promise<any> {
    var templateDir = Path.home().append('.raft/templates/' + templateType + '/');
    if (!templateDir.append('index.js').exists()) {
        throw new Error(errorMessage("No index.js at " + templateDir));
    }

    var templateSetup = require(templateDir.toString());
    var templateArgs = {
        Promise: Promise,
        Path: Path,
        prompt: {
            ask: ask
        },
        errorMessage: errorMessage
    };
    return templateSetup(templateArgs).then((context : any) => {
        return instantiateTemplate(templateDir, Path.cwd(), context);
    });
};

function errorMessage(msg : string) : string {
    return colors.red.underline("Error") + ": " + msg;
}

function ask(question : string, validatorFunction? : (input : string) => string) : Promise<any> {
    return new Promise(function(resolve, reject) {
        let validator = function(id : string) {return id};
        Promptly.prompt(question, {validator}, (err, value) => {
            if (err) {
                reject(err);
            } else {
                resolve(value);
            }
        });
    });
}
