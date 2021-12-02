import { Flag } from "./flags";

/**
 * Included in raftfiles to allow configuration of Dependencies.
 */
export interface DependencyDescriptor {
  /**
   * Name that should be used for the dependency.
   */
  name: string;

  /**
   * Describes the repository that can be used to download the dependency.
   */
  repository: RepositoryDescriptor;

  /*
   * Describes the build system used by the dependency.
   */
  buildSystem: "cmake" | "raft";

  /**
   * Path to the a patch that should be applied to the dependency before it is build.
   * The path is evaluated relative to the RAFT directory.
   */
  patches: string[];

  /**
   * Options that are passed to the CMake configure process.
   */
  configOptions?: Flag[];
}

/**
 * Included in raftfiles to allow configuration of source repositories.
 */
export interface RepositoryDescriptor {
  /**
   * The type of repository.
   * Options:
   *     git
   */
  type: string;
  /**
   * a URI describing where the repository can be found.
   */
  location: string;
  /**
   * Optional paramater used to describe the branch that should be used.
   */
  branch?: string;
}

/**
 * Describes a platform and architecture supported by the project.
 */
export interface ArchitectureDescriptor {
  architecture: string;
  platform: string;
}

/**
 * Describes the possible format of a RaftFile used to describe raft projects..
 */
export interface RaftfileRoot {
  dependencies: DependencyDescriptor[];

  /*
   * Architectures the project can be built for. Defaults to {"Host": ["Host"]}]
   */
  architectures?: { architecture: string; platform: string }[];
}
