pub const ArchitectureType = enum {
    host,
    x86_64,
    i386,
};

pub const Architecture = union(enum) {
    type: ArchitectureType,
    name: []const u8,

    host: *Architecture,
};

pub const host_architecture = Architecture{
    .type = ArchitectureType.host,
    .name = "Host",
};
