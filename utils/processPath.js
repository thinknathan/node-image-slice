"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPath = void 0;
const fs = require("fs/promises");
const path = require("path");
const workerPool_1 = require("./workerPool");
/**
 * Processes all files in the specified directory with the given image processing options.
 */
async function processPath(directoryPath, options, maxWorkers) {
    const workerPool = new workerPool_1.WorkerPool(maxWorkers);
    try {
        const files = await fs.readdir(directoryPath);
        // Add each file as a task to the worker pool
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            // Check if it's a file (not a subdirectory)
            if ((await fs.stat(filePath)).isFile()) {
                workerPool.addTask(filePath, options);
            }
        }
    }
    catch (err) {
        console.error(`Error reading directory: ${directoryPath}`, err);
    }
    await workerPool.allComplete();
    workerPool.exitAll();
    return true;
}
exports.processPath = processPath;
