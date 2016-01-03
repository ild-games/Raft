#!/usr/bin/env node
var Raft = require("Raft");

var argv = require('yargs')
    .usage('raft [--create]')
    .boolean(['create'])
    .argv
;

if (argv.create) {
    Raft.Action.create().done();
} else {
    Raft.Action.defaultAction().done();
}
