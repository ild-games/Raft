import * as colors from 'colors';
import * as child_process from 'child_process';
import * as _ from 'underscore';


import {Path} from './path';
import {raftlog} from './log';

/**
 * Object containing the output of a child process.
 */
export interface ProcessOutput {
    stdout : string;
    stderr : string;
}

export interface ExecuteOptions {
    /**
    * The directory to use as the current working directory.  Will be created
    * if it does not already exist.
    */
    cwd? : Path,

    /**
    * The message to use when logging events.
    */
    message? : string
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
    let nodeOptions : {cwd? : string, maxBuffer? : number} = {maxBuffer : 1024 * 1024 * 100};
    let wrappedArgs = args.map(arg => `"${arg}"`);
    let cmdStr = [command].concat(wrappedArgs).join(" ");
    let message = options.message || cmdStr;

    if (options.cwd) {
        raftlog(`Running in ${options.cwd.toString()}`, message, colors.bgGreen.bold);
        nodeOptions.cwd = options.cwd.toString();
        //Create the working directory if it does not exist.
        await options.cwd.createDirectory().then((created) => {
            if (created) {
                raftlog(`Created ${options.cwd.toString()}`, message, colors.bgGreen.bold);
            }
        });
    } else {
        raftlog("Running in the current working directory", message, colors.bgGreen.bold);
    }

    return new Promise<ProcessOutput>(function (resolve, reject) {
        child_process.exec(cmdStr, nodeOptions, function(error, buffers) {
            if (error) {
                raftlog("Rejected with an error", message, colors.bgRed.bold);
                reject(error);
            } else {
                raftlog("Finished successfully", message, colors.bgGreen.bold);
                resolve({ stdout : buffers[0], stderr : buffers[1]});
            }
        });
    });
}
