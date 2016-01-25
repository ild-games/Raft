/// <reference path="./typings/node/node.d.ts"/>

declare module 'gulp-mustache' {
    function mustache(tokens : any) : NodeJS.ReadWriteStream;

    export = mustache;
}
