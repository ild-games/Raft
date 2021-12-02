/**
 * Contains functions used to report errors to the user.
 */

/**
 * Report a configuration error to the user and stop the build.
 * @param  message Message describing the error.
 */
export function throwConfigurationError(message: string) {
  throw new Error(`Invalid Raft File: ${message}`);
}

/**
 * Report an error with the command line options provided to Raft.
 * @param  message Message describing the error.
 */
export function throwCommandLineError(message: string) {
  throw new Error(`Invalid Command Line Option: ${message}`);
}
