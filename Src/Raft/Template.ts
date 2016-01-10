import gulp = require('gulp');
import mustache = require('gulp-mustache')
import rename = require('gulp-rename')

import Path = require('./Path')

module Template {
    interface ParsedPath {
        dirname?: string;
        basename?: string;
        extname?: string;
    }

    export function useTemplate(templatePath : Path, destination : Path, context : any) : Promise<any> {
        return new Promise((resolve, reject) => {
            var stream = gulp.src(templatePath.append("**").toString())
                .pipe(mustache(context))
                .pipe(rename(function(parsedpath : ParsedPath) {
                    return renameFile(parsedpath, context);
                }))
                .pipe(gulp.dest(destination.toString()));
            stream.on("finish", resolve);
            stream.on("error", reject);
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
}
export = Template;
