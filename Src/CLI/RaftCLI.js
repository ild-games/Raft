#!/usr/bin/env node
var Raft = require("Raft");

var yargs = require('yargs');
var argv = yargs
    .usage('Usage: $0 <command>')
    .command('build', 'Build the raft project', function(yargs) {
        var argv = yargs
            .usage('Usage: $0 build [options]')
            .alias('p', 'platform')
            .describe('p', 'The platform that will be targed by the build. Defaults to Host.')
            .choices('p', ['Host', 'Android'])
            .argv;
        Raft.Action.build(argv);
    })
    .command('create', 'Create an instance of a template', function(yargs) {
        var argv = yargs
            .usage('Usage: $0 create [options]')
            .demand('t')
            .alias('t', 'template')
            .nargs('t', 1)
            .describe('t', 'Template folder in ~/.raft/templates/')
            .argv;
        checkCommands(yargs, argv, 1);
        Raft.Action.create(argv.template);
    })
    .argv;

checkCommands(yargs, argv, 1);

function checkCommands(yargs, argv, numRequired) {
    if (argv._.length < numRequired) {
        yargs.showHelp("log");
    }
}
