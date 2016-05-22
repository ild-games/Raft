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
    * @param  destination Describes where the repository should be downloaded to.
    * @return Promise that resolves when the repository is ready for use.
    */
    download(destination : Path) : Promise<any>;

    /**
    * Apply a patch to the code located in the directory.
    * @param  directory Aboslute path to the directory the code is located in.
    * @param  patch     Absolute path to the patch.
    * @return A promise that resolves once the patch is applied.
    */
     patch(repoDirectory : Path, patch : Path) : Promise<any>;
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
        return getGitRepo(this.uri, destination)
        .then(() => {
            if (this.branch) {
                return checkoutBranch(destination, this.branch);
            }
        });
    }

    /**
    * @see VCS.Repository.patch
    */
     patch(repoDirectory : Path, patch : Path) {
         if (repoDirectory.exists() && patch.exists()) {
             return System.execute('git', ['apply', patch.toString()], {cwd : repoDirectory});
         }
         return Promise.reject({});
     }
}

function getGitRepo(uri : string, destination : Path) : Promise<any> {
    if (!destination.exists()) {
        return System.execute(`git`, [`clone`, uri, destination.toString()]);
    }
    return Promise.resolve();
}

function checkoutBranch(repo : Path, branchName : string) {
    return System.execute(`git`, [`checkout`, branchName], { cwd : repo});
}
