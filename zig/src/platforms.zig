const Architecture = @import("architectures.zig").Architecture;
const host_architecture = @import("architectures.zig").host_architecture;

pub const PlatformType = enum {
    host,
    windows,
    macOS,
    linux,
    android,
    iOS,
};

pub const Platform = union(enum) {
    type: PlatformType,

    host: *Platform,

    fn supportedArchitectures(this: Platform) []Architecture {
        return switch (this) {
            .host => |_| [_]Architecture{
                host_architecture,
            },
        };
    }
};

pub const host_platform = Platform{
    .type = PlatformType.host,
};
