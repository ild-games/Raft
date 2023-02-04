const std = @import("std");

pub const FlagDescriptor = struct {
    name: []const u8 = "",
    value: []const u8 = "",
};

pub const PatchDescriptor = struct {
    path: []const u8 = "",
};

pub const RepositoryDescriptor = struct {
    type: []const u8 = "",
    location: []const u8 = "",
    branch: []const u8 = "",
    commit: []const u8 = "",
};

pub const DependencyDescriptor = struct {
    name: []const u8 = "",
    repository: RepositoryDescriptor = .{},
    buildSystem: []const u8 = "",
    patches: []const PatchDescriptor = &[_]PatchDescriptor{},
    configOptions: []const FlagDescriptor = &[_]FlagDescriptor{},
};

pub const ArchitectureDescriptor = struct {
    architecture: []const u8 = "",
    platform: []const u8 = "",
};

pub const RaftfileDescriptor = struct {
    executableName: []const u8 = "", // keep camelCase for JSON support
    dependencies: []const DependencyDescriptor = &[_]DependencyDescriptor{},
    architectures: []const ArchitectureDescriptor = &[_]ArchitectureDescriptor{},

    pub fn init(file: std.fs.File, allocator: std.mem.Allocator) !RaftfileDescriptor {
        var contents = try file.reader().readAllAlloc(allocator, std.math.maxInt(i64));
        defer allocator.free(contents);
        var stream = std.json.TokenStream.init(contents);
        return try std.json.parse(RaftfileDescriptor, &stream, .{
            .allocator = allocator,
            .ignore_unknown_fields = true,
        });
    }

    pub fn deinit(this: RaftfileDescriptor, allocator: std.mem.Allocator) void {
        std.json.parseFree(RaftfileDescriptor, this, .{
            .allocator = allocator,
            .ignore_unknown_fields = true,
        });
    }
};
