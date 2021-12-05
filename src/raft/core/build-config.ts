import * as os from "os";
import { Flag } from "./flags";
import { Project } from "./project";

/**
 * Defines the variables available when configuring a specific build.
 */
export interface Build {
  platform: Platform;
  architecture: Architecture;
  releaseBuild: boolean;
  distributable: boolean;
}

/**
 * Represents a specific target platform. Each platform can have multiple architectures.
 * For example Android is a platform and armabi is an architecture.
 */
export abstract class Platform {
  abstract name: string;

  abstract getArchitectures(): Architecture[];

  getDefaultArchitecture(): Architecture {
    return this.getArchitectures()[0];
  }

  getCMakeBuildOptions(): string[] {
    const cpuCount = os.cpus().length;

    return ["-j", `${cpuCount + 1}`];
  }
}

/**
 * Represents a specific target architecture. Example x86 vs x64. Each architecture is
 * unique to a platform. Android x86 has different build rules than Windows x86.
 */
export abstract class Architecture {
  abstract name: string;

  beforeBuild(project: Project, buildConfig: Build): Promise<any> {
    return Promise.resolve();
  }

  buildOptions(): string[] {
    return [];
  }

  getCMakeFlags(isRelease: boolean): Flag[] {
    return [];
  }

  getCMakeGeneratorTarget(): string | null {
    return null;
  }
}
