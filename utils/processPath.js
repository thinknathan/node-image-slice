"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPath = void 0;
const fs = require("fs");
const path = require("path");
const workerPool_1 = require("./workerPool");
/**
 * Processes all files in the specified directory with the given image processing options.
 */
function processPath(directoryPath, options, maxWorkers) {
    console.log({ directoryPath });
    const workerPool = new workerPool_1.WorkerPool(maxWorkers);
    // Read the contents of the directory
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error(`Error reading directory: ${directoryPath}`, err);
            return;
        }
        // Add each file as a task to the worker pool
        files.forEach((file) => {
            const filePath = path.join(directoryPath, file);
            // Check if it's a file (not a subdirectory)
            if (fs.statSync(filePath).isFile()) {
                workerPool.addTask(filePath, options);
            }
        });
        // Wait for all tasks to complete before exiting
        workerPool.waitForCompletion();
    });
}
exports.processPath = processPath;
