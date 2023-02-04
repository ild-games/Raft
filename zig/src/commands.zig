const std = @import("std");

const PlatformType = @import("platforms.zig").PlatformType;
const ArchitectureType = @import("architectures.zig").ArchitectureType;
const Project = @import("Project.zig").Project;
const BuildConfig = @import("BuildConfig.zig").BuildConfig;

pub fn build(
    platform: PlatformType,
    architecture: ArchitectureType,
    is_release_build: bool,
    is_distributable: bool,
    allocator: std.mem.Allocator,
) !void {
    var project = try Project.init(std.fs.cwd(), allocator);
    // var project = Project.init(std.fs.cwd(), allocator) catch |err| switch (err) {
    defer project.deinit();

    var build_config = try BuildConfig.init(
        project,
        platform,
        architecture,
        is_release_build,
        is_distributable,
    );

    std.log.info("Project name: {s}", .{project.name});
    std.log.info("Project executable: {s}", .{project.raftfile.executableName});
    std.log.info("BuildConfig platform: {any}", .{build_config.platform});
}
