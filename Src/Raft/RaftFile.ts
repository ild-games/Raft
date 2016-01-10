
module RaftFile {
    export interface DependencyDescriptor {
        name : string,
        repository : RepositoryDescriptor,
        buildSystem : string
    }

    export interface RepositoryDescriptor {
        type : string,
        location : string
    }

    export interface Root {
        dependencies : DependencyDescriptor[];
    }
}
export = RaftFile;
