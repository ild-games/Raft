/**
 * Log a message to the raft user.
 * @param  {string} tag     Tag used to describe the context of the log message.
 * @param  {string} message Information that needs to be communicated.
 */
export function raftlog(tag: string, message : string) {
    console.log(`${tag}:: ${message}`);
}
