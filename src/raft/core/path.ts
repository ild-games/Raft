import * as fs from 'fs';
import * as npath from 'path';
import * as mkdirp from 'mkdirp';
import * as _ from 'underscore';
import * as rimraf from 'rimraf';

import * as os from 'os';

/**
 * A class that is used to interact with paths. Instances of the path class are immutable.
 */
export class Path {
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
        return fs.existsSync(this.path);
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
        return new Promise((resolve, reject) => {
            mkdirp(this.path, function(error, result) {
                resolve(!error);
            });
        });
    }

    /**
     * Copy the file located at the path to the given path.
     * @param  path Destination path.
     * @return A promise that resolves when copy is complete.
     */
    copyTo(path : Path) : Promise<any> {
        return new Promise((resolve, reject) => {
            var rd = fs.createReadStream(this.toString());
            rd.on('error', reject);
            var wr = fs.createWriteStream(path.toString());
            wr.on('error', reject);
            wr.on('finish', resolve);
            rd.pipe(wr);
        });
    }

    /**
     * Open and read the file described by the path.
     * @return {Promise<string>} Resolves to the string contained within the file.
     */
    read() : Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(this.path.toString(), (err, buffer) => {
                if (err) { reject(err)}
                else { resolve(buffer.toString()) };
            });
        });
    }

    /**
     * Delete the given file described by the path. 
     * @param  path Path to delete.
     * @return A promise that resolves when the deletion is complete.
     */
    delete() : Promise<any> {
        return new Promise((resolve, reject) => {
            rimraf(this.toString(), function (error) {
                if (error) { reject(error); }
                else { resolve(); }
            });
        });
    }

    /**
     * Get the path for the current working directory.
     * @return {Path} A new path describing the working directory.
     */
    static cwd() : Path {
        return new Path(process.cwd());
    }

    /**
     * Get the path for the user's home directory.
     * @return {Path} A new path describing the user's home directory.
     */
    static home() : Path {
        return new Path(os.homedir());
    }

    /**
     * Gets the folder separator character for the given filesystem:
     * / on *nix systems and \ on Windows.
     * @return {string} File separator character.
     */
    static folderSeparator() : string {
        return npath.sep;
    }
}
