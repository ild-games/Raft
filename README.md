# Raft
Raft is build tool for the Ancona game engine.  It helps you get your ducks in order.

# Dependencies
In order to install Raft you need the following programs:

* node (last checked with version 16.13.0 LTS)
* npm (included when you install above node)

# Install instructions
1. Clone the repository onto your machine
2. Change into the directory
3. Run `npm install`
4. Run `npm run build`
5. Clone the contents of the templates directory into ~/.raft/templates/ (https://github.com/tlein/AnconaTemplateGame)
6. Add the following to your bashrc:
```
export RAFT_PATH=<Path to the root directory of the raft repo>
export PATH=$PATH:$RAFT_PATH/release/bin
export NODE_PATH=$NODE_PATH:$RAFT_PATH/release/lib
```

# Available Commands
* run `raft create` to create a new project.
* run `raft build` to build the project and it's dependencies.
* run `raft build [platform] [arch]` to build the project for a specific platform. (NOT IMPLEMENTED)
* run `raft run [platform] [arch]` to run the project. (NOT IMPLEMENTED)
* run `raft release-build` to build a release version of the project for all supported platforms. (NOT IMPLEMENTED)
