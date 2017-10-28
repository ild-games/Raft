/**
 * Describes how a flag should be formatted in a RaftFile. One usage of this is
 * passing configuration options to CMake.
 */
export interface Flag {
    name : string,
    value :  string
}

/**
 * Set of flags expected by the RAFT_CMAKE file.
 */
export const RAFT_FLAGS = {
    INCLUDE_DIR : "RAFT_INCLUDE_DIR",
    LIB_DIR : "RAFT_LIB_DIR",
    FRAMEWORK_DIR : "RAFT_FRAMEWORK_DIR",
    IS_DESKTOP : "RAFT_IS_DESKTOP",
    IS_MACOS: "RAFT_IS_MACOS",
    IS_ANDROID : "RAFT_IS_ANDROID",
    IS_IOS: "RAFT_IS_IOS",
    ARCH: "RAFT_ARCH",
    CMAKE_TOOLCHAIN : "CMAKE_TOOLCHAIN_FILE",
    TRUE : "true",
    FALSE : "false"
}
