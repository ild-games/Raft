#!/usr/bin/env node
var Raft = require("Raft");

var yargs = require('yargs')
    .usage('Usage: raft <command> [options]')
    .command('build', 'Build the raft project')
    .command('create', 'Create a new project');

var argv = yargs.argv;
var command = argv._.toString();

switch (command) {
    case "build":
        Raft.Action.build();
        break;
    case "create":
        Raft.Action.create();
        break;
    default:
        yargs.showHelp("log");
}
