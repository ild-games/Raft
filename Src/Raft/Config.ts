import Path = require('./Path');


/**
 * The config options for raft stored in ~/.raftconfig
 */
module Config {
    var configOptions : {[option: string]: string};

    /**
     * Gets an option out of the raftconfig file.
     * @param  {string} option The option to retrieve a value for.
     * @return {string}        The value of the option, throws an error if the option doesn't exist.
     */
    export function getOption(option : string) : string {
        return configOptions[option];
    }

    /**
     * Loads the configOptions from the file ~/.raftconfig
     * @return {Promise<any>} Promise that will resolve when the config file has been read.
     */
    export function readOptionsFromFile() : Promise<any> {
        return Path.home().append('.raftconfig').read().then((configBuffer) => {
            configOptions = JSON.parse(configBuffer);
        });
    }
}
export = Config;
