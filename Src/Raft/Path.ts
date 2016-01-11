import fs = require('fs');
import npath = require('path');
import mkdirp = require('mkdirp');
import _ = require('underscore');
import Promise = require('bluebird')

class Path {
    private path : string;
    //Imutable object.  Data model is a string, but it has several functions attached.
    constructor(pathStr : string) {
        this.path = pathStr;
    }

    append(... paths : (string|Path) []) : Path {
        var asStrings =  _.map(paths, (path) => path.toString());
        return new Path(npath.join(this.path, ...asStrings));
    }

    parent() : Path {
        return new Path(npath.dirname(this.path));
    }

    isRoot() : boolean {
        var parsedPath = npath.parse(this.path);
        return parsedPath.root === parsedPath.dir && parsedPath.root !== "";
    }

    toString() : string {
        return this.path;
    }

    exists() : boolean {
        try {
            fs.accessSync(this.path, fs.F_OK);
            return true;
        } catch (error) {
            return false;
        }
    }

    equals(path : Path) {
        return path != null && path.path === this.path;
    }

    createDirectory() : Promise<boolean> {
        return Promise.fromNode((callback) => {
            mkdirp(this.path, callback);
        }).then((success) => {
            return true;
        }).catch((error) => {
            //TODO: Validate error was caused by directory existing.
            return false;
        });
    }

    read() : Promise<string> {
        return Promise
        .fromCallback((callback) => {
            fs.readFile(this.path.toString(), callback)
        }).then((buffer : Buffer) => {
            return buffer.toString();
        });
    }

    static cwd() : Path {
        return new Path(process.cwd());
    }

}
export = Path;
