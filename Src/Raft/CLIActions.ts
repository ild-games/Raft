import _ = require('underscore');

import BuildConfig = require('./BuildConfig');
import Dependency = require('./Dependency');
import Path = require('./Path');
import Project = require('./Project');
import Promise = require('bluebird');
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
    var buildSettings : BuildConfig.Build = {
        isDeploy : false,
        platform : BuildConfig.Platform.Host,
        architecture : "host"
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
    var repo = new VCS.GitRepository("https://github.com/tlein/AnconaTemplateGame");
    var destinationDir = Path.cwd();

    var context = {
        gameName : "TestGame",
        gameAbbr : "TG"
    }

    return Template.instatiateRepositoryTemplate(repo, destinationDir, context);
}
