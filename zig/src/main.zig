const std = @import("std");
const PlatformType = @import("platforms.zig").PlatformType;
const ArchitectureType = @import("architectures.zig").ArchitectureType;
const commands = @import("commands.zig");

const usage =
    \\Usage: raft [command] [options]
    \\
    \\Commands:
    \\
    \\  build            Build Raft project
    \\  run              Create Raft project executable and run immediately
    \\
    \\General Options:
    \\
    \\  -h, --help       Print command-specific usage
    \\
;

pub fn fatal(comptime format: []const u8, args: anytype) noreturn {
    std.log.err(format, args);
    std.process.exit(1);
}

pub fn main() !void {
    var timer = try std.time.Timer.start();

    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();
    const args = try std.process.argsAlloc(allocator);

    var returnValue = mainArgs(allocator, args);

    var elapsed_seconds = @intToFloat(f32, timer.read()) / 1_000_000_000.0;
    std.log.info("Total time: {d:.3}s", .{elapsed_seconds});

    return returnValue;
}

pub fn mainArgs(allocator: std.mem.Allocator, args: []const []const u8) !void {
    if (args.len <= 1) {
        std.log.info("{s}", .{usage});
        fatal("expected command argument", .{});
    }

    const cmd = args[1];
    const cmd_args = args[2..];
    if (std.mem.eql(u8, cmd, "build")) {
        return cmdBuild(allocator, cmd_args);
    } else if (std.mem.eql(u8, cmd, "run")) {
        return cmdRun(allocator, cmd_args);
    } else {
        std.log.info("{s}", .{usage});
        fatal("unknown command: {s}", .{args[1]});
    }
}

pub const usage_build =
    \\Usage: raft build
    \\
    \\   Builds the Raft project.
    \\
    \\Options:
    \\   -h, --help                         Print this help and exit
    \\   -p, --platform [host|windows|      Which platform to build for
    \\                   macOS|linux|
    \\                   android|iOS]
    \\   -a, --architecture [host|x86_64|   Which architecture to build for
    \\                       i386]
    \\   -r, --release                      Builds for release mode
    \\   -d, --distributable                Builds for a distributable release
    \\
;

pub fn cmdBuild(allocator: std.mem.Allocator, args: []const []const u8) !void {
    var platform: PlatformType = .host;
    var architecture: ArchitectureType = .host;
    var is_release_build: bool = false;
    var is_distributable: bool = false;

    {
        var i: usize = 0;
        while (i < args.len) : (i += 1) {
            const arg = args[i];
            if (std.mem.startsWith(u8, arg, "-")) {
                if (std.mem.eql(u8, arg, "-h") or std.mem.eql(u8, arg, "--help")) {
                    std.log.info("{s}", .{usage_build});
                    return std.process.exit(0);
                } else if (std.mem.eql(u8, arg, "-p") or std.mem.eql(u8, arg, "--platform")) {
                    if (i + 1 >= args.len) {
                        fatal("expected [host|windows|macOS|linux|android|iOS] after {s}", .{arg});
                    }
                    i += 1;
                    const next_arg = args[i];
                    platform = std.meta.stringToEnum(PlatformType, next_arg) orelse {
                        fatal("expected [host|windows|macOS|linux|android|iOS] after {s}, found '{s}'", .{ arg, next_arg });
                    };
                } else if (std.mem.eql(u8, arg, "-a") or std.mem.eql(u8, arg, "--architecture")) {
                    if (i + 1 >= args.len) {
                        fatal("expected [host|x86_64|i386] after {s}", .{arg});
                    }
                    i += 1;
                    const next_arg = args[i];
                    architecture = std.meta.stringToEnum(ArchitectureType, next_arg) orelse {
                        fatal("expected [host|x86_64|i386] after {s}, found '{s}'", .{ arg, next_arg });
                    };
                } else if (std.mem.eql(u8, arg, "-r") or std.mem.eql(u8, arg, "--release")) {
                    is_release_build = true;
                } else if (std.mem.eql(u8, arg, "-d") or std.mem.eql(u8, arg, "--distributable")) {
                    is_distributable = true;
                }
            }
        }
    }

    try commands.build(
        platform,
        architecture,
        is_release_build,
        is_distributable,
        allocator,
    );
}

pub fn cmdRun(_: std.mem.Allocator, _: []const []const u8) !void {}
