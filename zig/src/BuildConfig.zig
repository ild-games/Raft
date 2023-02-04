const std = @import("std");

const Project = @import("Project.zig").Project;
const Platform = @import("platforms.zig").Platform;
const PlatformType = @import("platforms.zig").PlatformType;
const Architecture = @import("architectures.zig").Architecture;
const ArchitectureType = @import("architectures.zig").ArchitectureType;
const RaftfileDescriptor = @import("architectures.zig").ArchitectureType;

pub const BuildConfig = struct {
    platform: Platform,
    architecture: Architecture,
    is_release_build: bool,
    is_distributable: bool,

    pub const BuildConfigError = error{
        NoMatchingPlatformAndArchitectureCombo,
    };

    pub fn init(
        project: Project,
        platform_type: PlatformType,
        architecture_type: ArchitectureType,
        is_release_build: bool,
        is_distributable: bool,
    ) !BuildConfig {
        var platform: ?Platform = null;
        var architecture: ?Architecture = null;
        const platform_arch_combos = project.supportedPlatformAndArchitectureCombos();
        for (platform_arch_combos) |platform_arch_combo| {
            std.log.info("Platform: {any}\nArchitecture: {any}\n", .{
                platform_arch_combo.platform.type,
                platform_arch_combo.architecture.type,
            });

            if (platform_arch_combo.platform.type == platform_type and platform_arch_combo.architecture.type == architecture_type) {
                platform = platform_arch_combo.platform;
                architecture = platform_arch_combo.architecture;
                break;
            }
        }

        if (platform == null or architecture == null) {
            return error.NoMatchingPlatformAndArchitectureCombo;
        }

        return BuildConfig{
            .platform = platform orelse unreachable,
            .architecture = architecture orelse unreachable,
            .is_release_build = is_release_build,
            .is_distributable = is_distributable,
        };
    }
};
