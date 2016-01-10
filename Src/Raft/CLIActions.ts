import BuildConfig = require('./BuildConfig')
import Dependency = require('./Dependency')
import Path = require('./Path')
import Project = require('./Project')
import Template = require('./Template')
import raftlog = require('./Log')

export function defaultAction() {
    return build();
}

export function build(options : {platform? : string, architecture? : string} = {}) {
    var buildSettings : BuildConfig.Build = {
        isDeploy : false,
        platform : "host",
        architecture : "host"
    };

    return Project.find(Path.cwd())
    .then(function(project) {
        var dependencies = project.dependencies();
        raftlog("Project", `Getting ${dependencies.length} for the project`);
        var getDep = (dependency : Dependency.Dependency) => Dependency.getDependency(project, buildSettings, dependency);
        return Promise
        .all(_.map(dependencies, getDep))
        .then(function (){
            return project.build(buildSettings);
        });
    });
}

export function create() {
    raftlog("Project", "Creating a new project");
    var templateDir = new Path("/home/jeff/Code/ILikeDucks/AnconaTemplateGame");
    var destinationDir = Path.cwd();

    var context = {
        gameName : "TestGame",
        gameAbbr : "TG"
    }

    return Template.useTemplate(templateDir, destinationDir, context);
}
