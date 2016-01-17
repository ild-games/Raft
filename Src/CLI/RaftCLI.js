#!/usr/bin/env node
var Raft = require("Raft");

var yargs = require('yargs')
    .usage('Usage: raft <command> [options]')
    .command('build', 'Build the raft project')
    .command('create', 'Create a new project')
    .boolean(['create']);
var argv = yargs.argv;
var command = yargs.argv._.toString();

console.log("Command " + command);

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
