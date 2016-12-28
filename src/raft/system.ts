import * as child_process from 'child_process';
import * as _ from 'underscore';

import {Path} from './path';
import {raftlog} from './log';

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
export async function execute(command : string, args : string [], options? : ExecuteOptions) : Promise<ProcessOutput> {
    options = options || {};
    let directoryCreated : Promise<any>;
    let nodeOptions : {cwd? : string} = {};
    let wrappedArgs = _.map(args, (arg) => `"${arg}"`);
    let cmdStr = [command].concat(wrappedArgs).join(" ");
    let tag = options.tag || cmdStr;

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
        return new Promise((resolve) => {
            child_process.exec(cmdStr, nodeOptions as child_process.ExecOptionsWithBufferEncoding, (err : Error, stdout : Buffer, stderr : Buffer) => {
                raftlog(tag, "Finished successfully");
                resolve({stdout: stdout, stderr: stderr});
            });
        });
    });
}
