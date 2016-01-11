import child_process = require('child_process');
import Promise = require('bluebird');

import Path = require('./Path');
import raftlog = require('./Log');

module System {
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

    export function execute(command : string, options? : ExecuteOptions) : Promise<ProcessOutput> {
        options = options || {};
        var start = Promise.resolve();
        var nodeOptions : {cwd? : string} = {};
        var tag = options.tag || command;

        if (options.cwd) {
            raftlog(command,`Running in ${options.cwd.toString()}`);
            nodeOptions.cwd = options.cwd.toString();
            //Create the working directory if it does not exist.
            start = options.cwd.createDirectory().then((created) => {
                if (created) {
                    raftlog(tag, `Created ${options.cwd.toString()}`);
                }
            });
        } else {
            raftlog(tag, "Running in the current working directory");
        }

        return start.then(() => {
            return Promise.fromNode((callback) => {
                child_process.exec(command, nodeOptions, callback);
            }, {multiArgs : true});
        }).then((buffers : Buffer []) => {
            raftlog(tag, "Finished successfullly");
            return { stdout : buffers[0], stderr : buffers[1]};
        });
    }
}
export = System;
