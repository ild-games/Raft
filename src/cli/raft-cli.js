#!/usr/bin/env node
var Raft = require("raft");

var yargs = require('yargs');

function reportError(error) {
    console.log("Error executing Raft");
    console.log(error.stack);
}

var argv = yargs
    .usage('Usage: $0 <command>')
    .command('build', 'Build the raft project', function(yargs) {
        var argv = yargs
            .usage('Usage: $0 build [options]')
            .alias('p', 'platform')
            .describe('p', 'The platform that will be targeted by the build. Defaults to the first platform listed in the raftfile.')
            .alias('a', 'architecture')
            .describe('a', 'The architecture that will be targeted by the build. Defaults to the first architecture listed for the platform in the raftfile.')
            .boolean('r')
            .alias('r', 'release')
            .describe('r', 'Build release binaries instead of debug binaries')
            .argv;
        Raft.Action.build(argv).catch(reportError);
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
        Raft.Action.create(argv.template).catch(reportError);
    })
    .command('clean', 'Clean the build and include folders of project and dependencies', function(yargs) {
        var argv = yargs
            .usage('Usage: $0 clean')
            .argv;
        Raft.Action.clean().catch(reportError);
    })
    .argv;

checkCommands(yargs, argv, 1);

function checkCommands(yargs, argv, numRequired) {
    if (argv._.length < numRequired) {
        yargs.showHelp("log");
    }
}
