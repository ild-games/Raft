import * as _ from 'underscore';
import {red} from 'colors';
import {prompt} from 'promptly';

import {parseBuildConfig} from './build-config';
import {getDependency} from './dependency';
import {beforeBuild} from './hooks'
import {raftlog} from './log';
import {Path} from './path';
import {Project} from './project';
import {instantiateTemplate} from './template';
import {createDependency} from './raft-file-parser';
import {DependencyDescriptor} from './raft-file-descriptor';


/**
 * Build the raft project the user is currently in.
 * @param  options Can be used to specify the parameters for the build configuration.
 * @return A promise that resolves once the build is finished.
 */
export async function build(options? : {platform? : string, architecture? : string, release? : boolean}) {
    options = options || {};
    let buildSettings = parseBuildConfig(options.platform, options.architecture, options.release);
    let project = await Project.find(Path.cwd());
    let dependencies = _.map(project.dependencies(), (dependency : DependencyDescriptor) => {
        return createDependency(dependency, project.raftDir);
    });
    raftlog("Project", `Getting ${dependencies.length} for the project`);
    for (let dependency of dependencies) {
        await getDependency(project, buildSettings, dependency);
    }
    await beforeBuild(project, buildSettings);
    await project.build(buildSettings);
}

/**
 * Create an instance of a specified template.
 * @param  {string} templateType The type of template we're creating an instance of.
 * @return {Promise<any>}        A promise that resolves when the new template instance is ready.
 */
export function create(templateType : string) : Promise<any> {
    let templateDir = Path.home().append('.raft/templates/' + templateType + '/');
    if (!templateDir.append('index.js').exists()) {
        throw new Error(errorMessage("No index.js at " + templateDir));
    }

    let templateSetup = require(templateDir.toString());
    let templateArgs = {
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

function ask(question : string, validatorFunction? : (input : string) => string) : Promise<any> {
    return new Promise((resolve) => {
        if (validatorFunction) {
            prompt(question, {validator : validatorFunction}, (err : Error, value : string) => {
                resolve(value);
            });
        } else {
            prompt(question, (err : Error, value : string) => {
                resolve(value);
            });
        }
    });
}

function errorMessage(msg : string) : string {
    return red.underline("Error") + ": " + msg;
}
