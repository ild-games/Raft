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
    architecture : "x86",
    isDeploy : false
}

Raft.Action.defaultAction().done();
