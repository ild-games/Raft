import fs = require('fs');
import npath = require('path');
import mkdirp = require('mkdirp');
import _ = require('underscore');
import Promise = require('bluebird')

/**
 * A class that is used to interact with paths. Instances of the path class are immutable.
 */
class Path {
    private path : string;
    /**
     * Construct a new path.
     * @param  {string} pathStr String describing the Path's path.
     */
    constructor(pathStr : string) {
        this.path = pathStr;
    }

    /**
     * Append segments to the path.
     * @param  {(string|Path} ...paths The segments that should be appendend.
     * @return {Path}                A new Path instance with the segments appendend.
     */
    append(... paths : (string|Path) []) : Path {
        var asStrings =  _.map(paths, (path) => path.toString());
        return new Path(npath.join(this.path, ...asStrings));
    }

    /**
     * The parent directory of the path.
     * @return {Path} The parent directory of the path.
     */
    parent() : Path {
        return new Path(npath.dirname(this.path));
    }

    /**
     * Check if the path is a root path for the system.
     * @return {boolean} True if the path is a root path, false otherwise.
     */
    isRoot() : boolean {
        var parsedPath = npath.parse(this.path);
        return parsedPath.root === parsedPath.dir && parsedPath.root !== "";
    }

    /**
     * Converts the path to a string.
     * @return {string} String representation of the path.
     */
    toString() : string {
        return this.path;
    }

    /**
     * Check if the path exists on the file system.
     * @return {boolean} True if the file exists, false otherwise.
     */
    exists() : boolean {
        try {
            fs.accessSync(this.path, fs.F_OK);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if this path is equal to the provided path.
     * @param  {Path}   path Path to check for equality.
     * @return {[boolean]}   True if they are equal.  False otherwise.
     */
    equals(path : Path) {
        return path != null && path.path === this.path;
    }

    /**
     * Create the directory described by the path.
     * @return {Promise<boolean>} Promise that resolves to true if the path was
     *                            created and false if it already existed.
     */
    createDirectory() : Promise<boolean> {
        return Promise.fromCallback((callback) => {
            mkdirp(this.path, callback);
        }).then((success) => {
            return true;
        }).catch((error) => {
            //TODO: Validate error was caused by directory existing.
            return false;
        });
    }

    /**
     * Open and read the file described by the path.
     * @return {Promise<string>} Resolves to the string contained within the file.
     */
    read() : Promise<string> {
        return Promise
        .fromCallback((callback) => {
            fs.readFile(this.path.toString(), callback)
        }).then((buffer : Buffer) => {
            return buffer.toString();
        });
    }

    /**
     * Get the path for the current working directory.
     * @return {Path} A new path describing the working directory.
     */
    static cwd() : Path {
        return new Path(process.cwd());
    }

}
export = Path;
