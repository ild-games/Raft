const clap = @import("clap");
const std = @import("std");

const RaftOperation = enum {
    none,
    build,
};

const RaftPlatform = enum {
    host,
    windows,
    macOS,
    linux,
    android,
    iOS,
};

const RaftArchitecture = enum {
    host,
    win64,
    win32,
    x86_64,
    i386,
};

pub fn main() !void {
    const allocator = std.heap.page_allocator;

    const params = comptime clap.parseParamsComptime(
        \\-h, --help                           Display this help and exit.
        \\-o, --operation <OPERATION>          Chooses what operation to perform.
        \\-p, --buildPlatform <PLATFORM>     Allows a specific platform to be built for cross-compiling, default is the host platform.
        \\-a, --buildArchitecture <ARCH>... Allows a specific architecture to be built for cross-compiling, default is the host architecture.
        \\
    );

    const parsers = comptime .{
        .STR = clap.parsers.string,
        .INT = clap.parsers.int(usize, 10),
        .OPERATION = clap.parsers.enumeration(RaftOperation),
        .PLATFORM = clap.parsers.enumeration(RaftPlatform),
        .ARCH = clap.parsers.enumeration(RaftArchitecture),
    };

    var diag = clap.Diagnostic{};
    var res = clap.parse(clap.Help, &params, &parsers, .{ .diagnostic = &diag, }) catch |err| {
        diag.report(std.io.getStdOut().writer(), err) catch {};
        return;
    };
    defer res.deinit();

    var operation = RaftOperation.none;
    var platform = RaftPlatform.host;
    var architectures = std.ArrayList(RaftArchitecture).init(allocator);
    defer architectures.deinit();

    if (res.args.help) {
        return clap.help(std.io.getStdErr().writer(), clap.Help, &params, .{});
    }
    if (res.args.operation) |o| {
        operation = o;
    }
    if (res.args.buildPlatform) |p| {
        if (operation != RaftOperation.build) {
            std.log.err("Cannot specify the `buildPlatform` argument unless the `build` argument is also specified.\n", .{});
            return;
        }
        platform = p;
    }
    if (res.args.buildArchitecture.len > 0) {
        if (operation != RaftOperation.build) {
            std.log.err("Cannot specify the `buildArchitecture` argument unless the `build` argument is also specified.\n", .{});
            return;
        }
        for (res.args.buildArchitecture) |a| {
            try architectures.append(a);
        }
    }

    if (operation == RaftOperation.none) {
        return clap.help(std.io.getStdErr().writer(), clap.Help, &params, .{});
    }

    std.debug.print("operation: {any}\n", .{operation});
    std.debug.print("platform: {any}\n", .{platform});
    std.debug.print("archs: {any}\n", .{architectures.items});
}
