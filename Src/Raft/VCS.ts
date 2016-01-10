import System = require('./System')
import Path = require('./Path')

module Repository {
    export function getGitRepo(uri : string, destination : Path) {
        if (destination.exists()) {
            return System.execute(`git pull`, { cwd : destination});
        } else {
            return System.execute(`git clone ${uri} ${destination.toString()}`);
        }
    }

    export interface Repository {
        download(destination : Path) : Promise<any>;
    }

    export class GitRepository implements Repository {
        uri : string;

        constructor(uri : string) {
            this.uri = uri;
        }

        download(destination : Path) {
            return getGitRepo(this.uri, destination);
        }
    }
}
export = Repository;
