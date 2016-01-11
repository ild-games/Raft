import System = require('./System')
import Path = require('./Path')
import Promise = require('bluebird')

module Repository {
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

    export interface Repository {
        download(destination : Path) : Promise<any>;
    }

    export class GitRepository implements Repository {
        uri : string;
        branch : string;

        constructor(uri : string, branch? : string) {
            this.uri = uri;
            this.branch = branch;
        }

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
}
export = Repository;
