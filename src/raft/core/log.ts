/**
 * Log a message to the raft user.
 * @param  {string} tag     Tag used to describe the context of the log message.
 * @param  {string} message Information that needs to be communicated.
 */
export function raftlog(
  tag: string,
  message: string,
  tagColorFunc: Function = null,
  messageColorFunc: Function = null
) {
  if (tagColorFunc) {
    console.log(tagColorFunc(tag));
  } else {
    console.log(tag);
  }

  if (messageColorFunc) {
    console.log(messageColorFunc(message));
  } else {
    console.log(message);
  }

  console.log("\n");
}
