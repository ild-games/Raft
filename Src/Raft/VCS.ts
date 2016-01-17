import System = require('./System')
import Path = require('./Path')
import Promise = require('bluebird')

/**
* An interface that describes how clients can interact with repository.
*/
export interface Repository {
    /**
    * Downloads the repository to the given path.  If the repository was previously
    * downloaded, then this command will also update the source.
    * @param  {Path}         destination Describes where the repository should be downloaded to.
    * @return {Promise<any>}             A promise that resolves when the repository is ready for use.
    */
    download(destination : Path) : Promise<any>;
}

/**
* A Repository implementation for git.
*/
export class GitRepository implements Repository {
    uri : string;
    branch : string;

    /**
    * @param  {string} uri    URI that can be used to clone the repository.
    * @param  {string} branch (Optional) Branch that should be used.
    */
    constructor(uri : string, branch? : string) {
        this.uri = uri;
        this.branch = branch;
    }

    /**
    * @see VCS.Repository.download
    */
    download(destination : Path) {
        console.log(`Getting repo: ${this.uri} branch: ${this.branch}`)
        return getGitRepo(this.uri, destination)
        .then(() => {
            if (this.branch) {
                return checkoutBranch(destination, this.branch);
            }
        });
    }
}

function getGitRepo(uri : string, destination : Path) {
    if (destination.exists()) {
        return System.execute(`git pull`, { cwd : destination});
    } else {
        return System.execute(`git clone ${uri} ${destination.toString()}`);
    }
}

function checkoutBranch(repo : Path, branchName : string) {
    return System.execute(`git checkout ${branchName}`, { cwd : repo});
}
