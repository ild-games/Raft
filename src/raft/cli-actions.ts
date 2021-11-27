import * as colors from "colors";
import * as Promptly from "promptly";
import * as _ from "underscore";
import { getDependency } from "./core/dependency";
import { throwCommandLineError } from "./core/error";
import { raftlog } from "./core/log";
import { Path } from "./core/path";
import { Project } from "./core/project";
import {
  createDependency,
  getSupportedArchitectures,
} from "./raft-file-parser";
import { instantiateTemplate } from "./template";

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
  let startTime = process.hrtime();
  let project = await Project.find(Path.cwd());

  let dependencies = _.map(project.dependencies(), (dependency) => {
    return createDependency(dependency, project.raftDir);
  });

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

  let buildSettings = {
    releaseBuild: !!options.release,
    platform: architectures[0].platform,
    architecture: architectures[0].architecture,
    distributable: options.distribute,
  };

  let projectTagColorFunc = colors.bgBlue.bold;
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
  let endTime = process.hrtime(startTime);
  let endTimeInSeconds = (endTime[0] * 1e9 + endTime[1]) / 1e9;
  console.log(`Total time: ${endTimeInSeconds.toFixed(2)}s`);
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
  onlyCleanDependencies?: boolean;
}): Promise<any> {
  let project = await Project.find(Path.cwd(), true);
  if (!project) {
    throw new Error(errorMessage("You must be in a Raft project folder"));
  }

  project
    .clean(options.onlyCleanDependencies)
    .then(() => {
      console.log(
        successMessage(
          `${
            options.onlyCleanDependencies ? "Only the dependencies'" : "All"
          } build and install folders have been deleted`
        )
      );
    })
    .catch((err) => {
      throw new Error(errorMessage(err));
    });
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
