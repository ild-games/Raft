const std = @import("std");

const RaftfileDescriptor = @import("RaftfileDescriptor.zig").RaftfileDescriptor;
const Platform = @import("platforms.zig").Platform;
const PlatformType = @import("platforms.zig").PlatformType;
const host_platform = @import("platforms.zig").host_platform;
const Architecture = @import("architectures.zig").Architecture;

pub const Project = struct {
    const raft_project_dir_name = "Raft";
    const raft_project_raft_file_name = "raftfile.json";

    allocator: std.mem.Allocator,
    name: []const u8,
    raftfile: RaftfileDescriptor,

    pub const ProjectInitError = error{
        ProjectDirNotFound,
    };

    pub fn init(starting_working_dir: std.fs.Dir, allocator: std.mem.Allocator) !Project {
        var project_dir = findProjectDir(allocator, starting_working_dir) catch |err| switch (err) {
            error.NotDir => return error.ProjectDirNotFound,
            error.FileNotFound => return error.ProjectDirNotFound,
            else => |e| return e,
        };
        defer project_dir.close();

        const project_dir_path = try project_dir.realpathAlloc(allocator, ".");
        const project_name = std.fs.path.basename(project_dir_path);
        const raftfile = try parseRaftJsonFile(project_dir, allocator);

        return Project{
            .allocator = allocator,
            .name = project_name,
            .raftfile = raftfile,
        };
    }

    pub fn deinit(this: Project) void {
        this.allocator.free(this.name);
        this.raftfile.deinit(this.allocator);
    }

    fn findProjectDir(allocator: std.mem.Allocator, starting_dir: std.fs.Dir) !std.fs.Dir {
        var working_dir = try starting_dir.openDir(".", .{});
        while (true) {
            if (try raftDirExists(working_dir) and try raftFileExists(working_dir)) {
                // found `working_dir/Raft/raftfile.json`, which indicates a Raft project
                break;
            }

            // Try going up to the parent directory to find the Raft project directory.
            // If current directory is the OS root, stop and return an error.
            working_dir = try working_dir.openDir("..", .{});
            if (try dirIsOsRoot(working_dir, allocator)) {
                return std.fs.Dir.OpenError.FileNotFound;
            }
        }

        return working_dir;
    }

    fn raftDirExists(base_dir: std.fs.Dir) !bool {
        var opened_dir = base_dir.openDir(raft_project_dir_name, .{}) catch |err| switch (err) {
            error.NotDir => return false,
            error.FileNotFound => return false,
            else => |e| return e,
        };
        defer opened_dir.close();

        return true;
    }

    fn dirIsOsRoot(dir: std.fs.Dir, allocator: std.mem.Allocator) !bool {
        const dir_path = try dir.realpathAlloc(allocator, ".");
        defer allocator.free(dir_path);

        return std.fs.path.dirname(dir_path) == null;
    }

    fn raftFileExists(base_dir: std.fs.Dir) !bool {
        var opened_dir = base_dir.openDir(raft_project_dir_name, .{}) catch |err| switch (err) {
            error.NotDir => return false,
            error.FileNotFound => return false,
            else => |e| return e,
        };
        defer opened_dir.close();

        var opened_file = opened_dir.openFile(raft_project_raft_file_name, .{}) catch |err| switch (err) {
            error.FileNotFound => return false,
            else => |e| return e,
        };
        defer opened_file.close();

        return true;
    }

    fn parseRaftJsonFile(project_dir: std.fs.Dir, allocator: std.mem.Allocator) !RaftfileDescriptor {
        var raft_dir = try project_dir.openDir(raft_project_dir_name, .{});
        defer raft_dir.close();
        var raft_file = try raft_dir.openFile(raft_project_raft_file_name, .{});
        defer raft_file.close();

        return RaftfileDescriptor.init(raft_file, allocator);
    }

    pub const PlatformAndArchitectureCombo = struct {
        platform: Platform,
        architecture: Architecture,
    };

    pub fn supportedPlatformAndArchitectureCombos(this: Project) []PlatformAndArchitectureCombo {
        const platforms = [_]Platform{
            host_platform,
        };

        for (this.raftfile.architectures) |arch| {
            var found_platform = false;
            for (platforms) |platform| {
                if (platform.type == std.meta.stringToEnum(PlatformType, arch.platform)) {
                    found_platform = true;
                }
            }
        }

        // TODO finish this function and return stuff!
        return &[_]PlatformAndArchitectureCombo{};
    }
};
