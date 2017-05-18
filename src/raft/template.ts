//Typings files don't support ES6 style import

import * as gulp from 'gulp';
import * as gulpif from 'gulp-if';
import * as rename from 'gulp-rename';
import * as mustache from 'gulp-mustache';

import * as rimraf from 'rimraf';

import {Path} from './core/path';
import {Repository} from './core/vcs';

interface ParsedPath {
    dirname?: string;
    basename?: string;
    extname?: string;
}

/**
* Instantiate the template found at the templatePath into the destination path.
* @param  {Path}         templatePath The path where the template can be found.
* @param  {Path}         destination  The directory that will be instantiated using the template.
* @param  {any}          context      Values in the context will be available in the templates.
* @return {Promise<any>}              The promise will be resolved after the template is instantiated.
*/
export function instantiateTemplate(templatePath : Path, destination : Path, context : any) : Promise<any> {
    return new Promise((resolve, reject) => {
        var stream = gulp.src([templatePath.append("**").toString(), '!' + templatePath.append('index.js').toString()])
        .pipe(gulpif("!**/*.png", mustache(context)))
        .pipe(rename(function(parsedpath : ParsedPath) {
            return renameFile(parsedpath, context);
        }))
        .pipe(gulp.dest(destination.toString()));
        stream.on("finish", resolve);
        stream.on("error", reject);
    });
}

/**
* Use the repository to instantiate a template in the given location.
* @param  repo         The repository the template is located in.
* @param  destination  The directory that will be instantiated using the template.
* @param  context      Values in the context will be available in the templates.
* @return The promise will resolve after the template is instantiated.
*/
export async function instantiateRepositoryTemplate(repo : Repository, destination : Path, context : any) {
    var repoLocation = destination.append(".template");
    await repo.download(repoLocation);
    await instantiateTemplate(repoLocation, destination, context);
    return new Promise(function(resolve, reject) {
        rimraf(repoLocation.toString(), function (error) {
            if (error) { reject(error); }
            else { resolve(); }
        });
    });
}


function renameFile(parsedpath : ParsedPath, context : any) {
    for (var key in context) {
        parsedpath.dirname = replaceAll(parsedpath.dirname, `__${key}__`, context[key]);
        parsedpath.basename = replaceAll(parsedpath.basename, `__${key}__`, context[key]);
        parsedpath.extname = replaceAll(parsedpath.extname, `__${key}__`, context[key]);
    }
}

function replaceAll(str : string, find: string, replaceWith : string) {
    return str.split(find).join(replaceWith);
}
