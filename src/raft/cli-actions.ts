import * as colors from "colors";
import * as Promptly from "promptly";
import * as _ from "underscore";
import { Build } from "./core/build-config";
import { getDependency } from "./core/dependency";
import { throwCommandLineError } from "./core/error";
import { raftlog } from "./core/log";
import { Path } from "./core/path";
import { Project } from "./core/project";
import { execute } from "./core/system";
import {
  createDependency,
  getSupportedArchitectures,
} from "./raft-file-parser";
import { instantiateTemplate } from "./template";

function getBuildConfig(
  project: Project,
  options: {
    platform?: string;
    architecture?: string;
    release?: boolean;
    distribute?: boolean;
  } = {}
): Build {
  let architectures = getSupportedArchitectures(project.architectures())
    .filter(
      (arch) =>
        !options.platform ||
        options.platform.toUpperCase() === arch.platform.name.toUpperCase()
    )
    .filter(
      (arch) =>
        !options.architecture ||
        options.architecture.toUpperCase() ===
          arch.architecture.name.toUpperCase()
    );

  if (architectures.length === 0) {
    throwCommandLineError(
      "No match for the provided architecture and platform"
    );
  }

  return {
    releaseBuild: !!options.release,
    platform: architectures[0].platform,
    architecture: architectures[0].architecture,
    distributable: options.distribute,
  };
}

/**
 * Build the raft project the user is currently in.
 * @param  options Can be used to specify the parameters for the build configuration.
 * @return A promise that resolves once the build is finished.
 */
export async function build(
  options: {
    platform?: string;
    architecture?: string;
    release?: boolean;
    distribute?: boolean;
  } = {}
): Promise<any> {
  const startTime = process.hrtime();
  const project = await Project.find(Path.cwd());
  const buildSettings = getBuildConfig(project, options);

  const dependencies = _.map(project.dependencies(), (dependency) => {
    return createDependency(dependency, project.raftDir);
  });

  const projectTagColorFunc = colors.bgBlue.bold;
  raftlog(
    "Project",
    `Getting ${dependencies.length} for the project`,
    projectTagColorFunc
  );
  await Promise.all(
    dependencies.map((dependency) =>
      getDependency(project, buildSettings, dependency)
    )
  );

  raftlog("Project", `Running before build hooks`, projectTagColorFunc);
  await buildSettings.architecture.beforeBuild(project, buildSettings);

  raftlog("Project", `Running the build`, projectTagColorFunc);
  await project.build(buildSettings);

  if (project.doesExtensionExist()) {
    raftlog("Project", "Running build project extension", projectTagColorFunc);
    await project.extension(buildSettings);
    console.log("\n");
  }

  raftlog("Project", `Exiting`, projectTagColorFunc);
  const endTime = process.hrtime(startTime);
  const endTimeInSeconds = (endTime[0] * 1e9 + endTime[1]) / 1e9;
  console.log(`Total time: ${endTimeInSeconds.toFixed(2)}s`);
}

export async function run(
  options: {
    platform?: string;
    architecture?: string;
    release?: boolean;
  } = {}
): Promise<any> {
  const project = await Project.find(Path.cwd());
  const executableName = project.executableName;
  if (!executableName) {
    throw new Error(
      "Can't run project, no exectubleName specified in raftfile!"
    );
  }

  await build(options);

  const buildConfig = getBuildConfig(project, options);
  const buildDir = project.dirForBuild(buildConfig);
  const buildType = project.getBuildType(options.release);
  const buildSymbol = buildConfig.platform.getBuildSymbolPattern(buildType);
  return execute(`${buildSymbol}${executableName}`, [], { cwd: buildDir });
}

/**
 * Create an instance of a specified template.
 * @param  {string} templateType The type of template we're creating an instance of.
 * @return {Promise<any>}        A promise that resolves when the new template instance is ready.
 */
export function create(templateType: string): Promise<any> {
  let templateDir = Path.home().append(".raft/templates/" + templateType + "/");
  if (!templateDir.append("index.js").exists()) {
    throw new Error(errorMessage("No index.js at " + templateDir));
  }

  let templateSetup = require(templateDir.toString());
  let templateArgs = {
    Promise: Promise,
    Path: Path,
    prompt: {
      ask: ask,
    },
    errorMessage: errorMessage,
  };
  return templateSetup(templateArgs).then((context: any) => {
    return instantiateTemplate(templateDir, Path.cwd(), context);
  });
}

export async function clean(options: {
  onlyCleanAllDependcies?: boolean;
  onlyCleanSpecificDependency?: string;
}): Promise<any> {
  let project = await Project.find(Path.cwd(), true);
  if (!project) {
    throw new Error(errorMessage("You must be in a Raft project folder"));
  }

  try {
    if (options.onlyCleanSpecificDependency) {
      const supportedArchitectures = getSupportedArchitectures(
        project.architectures()
      );
      const debugBuildConfigs = supportedArchitectures.map((architecture) => {
        return {
          architecture: architecture.architecture,
          platform: architecture.platform,
          releaseBuild: false,
          distributable: false,
        };
      });
      const releaseBuildConfigs = supportedArchitectures.map((architecture) => {
        return {
          architecture: architecture.architecture,
          platform: architecture.platform,
          releaseBuild: true,
          distributable: false,
        };
      });
      await project.cleanSpecificDependency(
        [...debugBuildConfigs, ...releaseBuildConfigs],
        options.onlyCleanSpecificDependency
      );
      console.log(
        successMessage(
          `The dependency "${options.onlyCleanSpecificDependency}" build and install directories have been cleaned`
        )
      );
    } else if (options.onlyCleanAllDependcies) {
      await project.cleanAllDependencies();
      console.log(
        "All dependencies build and install directories have been cleaned"
      );
    } else {
      await project.cleanAll();
      console.log("All build and install directories have been cleaned");
    }
  } catch (err) {
    throw new Error(errorMessage(err));
  }
}

function errorMessage(msg: string): string {
  return colors.red.underline("Error") + ": " + msg;
}

function successMessage(msg: string): string {
  return colors.green.underline("Success") + ": " + msg;
}

function ask(
  question: string,
  validatorFunction?: (input: string) => string
): Promise<any> {
  return new Promise(function (resolve, reject) {
    let validator = function (id: string) {
      return id;
    };
    Promptly.prompt(question, { validator }, (err, value) => {
      if (err) {
        reject(err);
      } else {
        resolve(value);
      }
    });
  });
}
