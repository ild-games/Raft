#!/usr/bin/env node
var Raft = require("Raft");

var project = Raft.Project.find(Raft.Path.cwd());

var JSONCPP = {
    name : "JsonCPP",
    repository : {
        type : "git",
        location : "https://github.com/open-source-parsers/jsoncpp"
    },
    buildSystem : "cmake"
}

var SFML = {
    name : "SFML",
    repository : {
        type : "git",
        location : "https://github.com/SFML/SFML"
    },
    buildSystem : "cmake"
}

var DEFAULT_BUILD = {
    platform : "desktop",
    architecture : "x86"
}

if (project) {
    console.log("Project found at " + project.root.toString());

    var jsoncpp = Raft.createDependency(JSONCPP);
    var sfml = Raft.createDependency(SFML);

    Raft.getDependency(project, jsoncpp, DEFAULT_BUILD).done();
    Raft.getDependency(project, sfml, DEFAULT_BUILD).done();
} else {
    console.log("No project found");
}
