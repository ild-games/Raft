# Overview of Running Raft Build

1. Download Dependencies Transitively
2. Run all onDownload Hooks for every dependency that was just downloaded.
3. Build then install dependencies in the correct order.
4. Configure the current project's CMAKE.
5. Build the current project's CMAKE.

# Variables for the current build
* Platform
* Architecture
* Is Deploy
