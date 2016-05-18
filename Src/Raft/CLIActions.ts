import _ = require('underscore');
import Promise = require('bluebird');
import Promptly = require('promptly');

import BuildConfig = require('./BuildConfig');
import Config = require('./Config');
import Dependency = require('./Dependency');
import Path = require('./Path');
import Project = require('./Project');
import Template = require('./Template');
import RaftFile = require('./RaftFile');
import VCS = require('./VCS');
import raftlog = require('./Log');

/**
 * Build the raft project the user is currently in.
 * @param  {object} options Can be used to specify the parameters for the build configuration.
 * @return {Promise}        A promise that resolves once the build is finished.
 */
export function build(options : {platform? : string, architecture? : string} = {}) : Promise<any> {

    //TODO implement platform and architecture arguments
    var buildSettings : BuildConfig.Build = {
        isDeploy : false,
        platform : BuildConfig.Platform.Host,
        architecture : BuildConfig.Architecture.Host
    };

    return Project.find(Path.cwd())
    .then(function(project) {
        var dependencies = project.dependencies();
        raftlog("Project", `Getting ${dependencies.length} for the project`);
        return Promise
        .all(_.map(
            _.map(dependencies, RaftFile.createDependency),
            (dependency) => Dependency.getDependency(project, buildSettings, dependency)
        )).then(function (){
            return project.build(buildSettings);
        });
    });
}

/**
 * Create a new project in the current directory
 * @return {Promise<any>} A promise that resolves when the new project is ready.
 */
export function create() : Promise<any> {
    raftlog("Project", "Creating a new project");
    var repo = new VCS.GitRepository(Config.getOption("templateRepo"));
    var destinationDir = Path.cwd();

    function isValidName(input : string) {
        var regex = /^[a-z]+$/i;

        if (!regex.test(input)) {
            throw Error("The name cannot contain any spaces.");
        }

        return input;
    }

    function isValidDirectory(input : string) {
        var path = new Path(input);

        if (!path.exists()) {
            throw Error("Path does not exist.");
        }

        return input;
    }

    function ask(question : string, validator? : (input: string) => string) : Promise<any> {
        return Promise.fromCallback((callback) => {
            if (validator) {
                Promptly.prompt(question, {validator : validator}, callback);
            } else {
                Promptly.prompt(question, callback);
            }
        });
    }

    function askYesNo(question : string) : Promise<any> {
        return Promise.fromCallback((callback) => {
            Promptly.confirm(question, callback);
        });
    }

    var context = {
        gameName : "",
        gameAbbr : ""
    }

    return ask("Game Name (Ex Duckling): ", isValidName).then((gameName) => {
        context.gameName = gameName;
        return ask("Game Abbreviation (Ex DUC): ", isValidName);
    }).then((gameAbbr) => {
        context.gameAbbr = gameAbbr;
        return askYesNo("Pull template from repo?");
    }).then((pullFromRepo) => {
        if (pullFromRepo) {
            return Template.instatiateRepositoryTemplate(repo, destinationDir, context);
        } else {
            var defaultTemplatePath = Config.getOption("defaultTemplatePath");
            return askYesNo("Use default template directory in ~/.raftconfig? (" + defaultTemplatePath + "): ").then((useDefaultTemplateDir) => {
                if (useDefaultTemplateDir) {
                    return Template.instantiateTemplate(
                        new Path(defaultTemplatePath),
                        destinationDir,
                        context);
                }
                return ask("Enter directory of template game: ", isValidDirectory).then((templateDir) => {
                    return Template.instantiateTemplate(
                        new Path(templateDir),
                        destinationDir,
                        context);
                });
            });
        }
    });
}
