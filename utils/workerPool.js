"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerPool = void 0;
const worker_threads_1 = require("worker_threads");
const path = require("path");
/**
 * Manages a pool of worker threads for parallel processing of image files.
 */
class WorkerPool {
    /**
     * Creates a new WorkerPool instance.
     *
     * @param maxWorkers - The maximum number of worker threads in the pool.
     */
    constructor(maxWorkers) {
        this.workers = [];
        this.taskQueue = [];
        this.maxWorkers = maxWorkers;
    }
    /**
     * Creates a worker thread for processing a specific file with given options.
     *
     * @param filePath - The path of the file to process.
     * @param options - Image processing options for the file.
     */
    createWorker(filePath, options) {
        const worker = new worker_threads_1.Worker(path.join(__dirname, "processImage.js"), {
            workerData: { filePath, options },
        });
        // Listen for messages and errors from the worker
        worker.on("message", (message) => {
            console.log(message);
            this.processNextTask();
        });
        worker.on("error", (err) => {
            console.error(`Error in worker for file ${filePath}:`, err);
            this.processNextTask();
        });
        this.workers.push(worker);
    }
    /**
     * Processes the next task in the queue.
     */
    processNextTask() {
        const nextTask = this.taskQueue.shift();
        if (nextTask) {
            this.createWorker(nextTask.filePath, nextTask.options);
        }
    }
    /**
     * Adds a task to the worker pool for processing.
     *
     * @param filePath - The path of the file to process.
     * @param options - Image processing options for the file.
     */
    addTask(filePath, options) {
        if (this.workers.length < this.maxWorkers) {
            this.createWorker(filePath, options);
        }
        else {
            this.taskQueue.push({ filePath, options });
        }
    }
    /**
     * Waits for all tasks to complete before exiting.
     */
    waitForCompletion() {
        this.workers.forEach((worker) => {
            worker.on("exit", () => {
                this.processNextTask();
            });
        });
    }
}
exports.WorkerPool = WorkerPool;
