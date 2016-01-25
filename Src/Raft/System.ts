import child_process = require('child_process');
import _ = require('underscore');
import Promise = require('bluebird');

import Path = require('./Path');
import raftlog = require('./Log');

/**
 * Object containing the output of a child process.
 */
export interface ProcessOutput {
    stdout : Buffer;
    stderr : Buffer;
}

export interface ExecuteOptions {
    /**
    * The directory to use as the current working directory.  Will be created
    * if it does not already exist.
    */
    cwd? : Path,

    /**
    * The tag to use when logging events.
    */
    tag? : string
}

/**
 * Execute a command in a child process.
 * @param  {string}                 command  Shell command to execute.
 * @param  {string []}              args     Array of arguments that will be passed to the command. Note: The args argument is not optional in order to remind people not to pass arguments by concatenating them to the command string.
 * @param  {ExecuteOptions}         options  (Optional) @see ExecuteOptions
 * @return {Promise<ProcessOutput>}          Promise that resolves to the process's output.
 */
export function execute(command : string, args : string [], options? : ExecuteOptions) : Promise<ProcessOutput> {
    options = options || {};
    var directoryCreated : Promise<any>;
    var nodeOptions : {cwd? : string} = {};
    var wrappedArgs = _.map(args, (arg) => `"${arg}"`);
    var cmdStr = [command].concat(wrappedArgs).join(" ");
    var tag = options.tag || cmdStr;

    if (options.cwd) {
        raftlog(tag, `Running in ${options.cwd.toString()}`);
        nodeOptions.cwd = options.cwd.toString();
        //Create the working directory if it does not exist.
        directoryCreated = options.cwd.createDirectory().then((created) => {
            if (created) {
                raftlog(tag, `Created ${options.cwd.toString()}`);
            }
        });
    } else {
        directoryCreated = Promise.resolve(); //No need to create directory
        raftlog(tag, "Running in the current working directory");
    }

    return directoryCreated.then(() => {
        return Promise.fromNode((callback) => {
            child_process.exec(cmdStr, nodeOptions, callback);
        }, {multiArgs : true});
    }).then((buffers : Buffer []) => {
        raftlog(tag, "Finished successfullly");
        return { stdout : buffers[0], stderr : buffers[1]};
    });
}
