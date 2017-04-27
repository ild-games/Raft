
import * as _ from 'underscore';

import * as Promptly from 'promptly';
import * as colors from 'colors';

import {parseBuildConfig} from './build-config';
import {getDependency} from './dependency';
import {beforeBuild} from './hooks'
import {raftlog} from './log';
import {Path} from './path';
import {Project} from './project';
import {instantiateTemplate} from './template';
import {createDependency} from './raft-file-parser';


/**
 * Build the raft project the user is currently in.
 * @param  options Can be used to specify the parameters for the build configuration.
 * @return A promise that resolves once the build is finished.
 */
export function build(options : {platform? : string, architecture? : string, release? : boolean} = {}) : Promise<any> {

    var buildSettings = parseBuildConfig(options.platform, options.architecture, options.release);

    return Project.find(Path.cwd()).then(function(project) {
        var dependencies = _.map(project.dependencies(), (dependency) => {
            return createDependency(dependency, project.raftDir)
        });

        raftlog("Project", `Getting ${dependencies.length} for the project`);

        return Promise.all(dependencies.map(dependency => getDependency(project, buildSettings, dependency)))
            .then(() => beforeBuild(project, buildSettings))
            .then(() => project.build(buildSettings));
    });
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
