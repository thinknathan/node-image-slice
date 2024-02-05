"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerPool = void 0;
const worker_threads_1 = require("worker_threads");
const path = require("path");
/**
 * Manages a pool of worker threads for parallel processing of image files.
 */
class WorkerPool {
    isComplete() {
        return (this.taskQueue.length === 0 &&
            this.workers.every((worker) => worker.isIdle));
    }
    /**
     * Terminate all workers in the pool.
     */
    exitAll() {
        this.workers.forEach((worker) => worker.terminate());
        this.workers = [];
    }
    /**
     * Returns a promise that resolves when all work is done.
     */
    async allComplete() {
        if (this.isComplete()) {
            return Promise.resolve();
        }
        if (!this.completePromise) {
            this.completePromise = new Promise((resolve) => {
                this.completeResolve = resolve;
            });
        }
        return this.completePromise;
    }
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
        const worker = new worker_threads_1.Worker(path.join(__dirname, 'processImage.js'));
        worker.isIdle = false;
        worker.postMessage({ filePath, options });
        // Listen for messages and errors from the worker
        worker.on('message', () => {
            worker.isIdle = true;
            this.processNextTask();
        });
        worker.on('error', (err) => {
            console.error(`Error in worker for file ${filePath}:`, err);
            worker.isIdle = true;
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
            if (this.workers.length < this.maxWorkers) {
                this.createWorker(nextTask.filePath, nextTask.options);
            }
            else {
                const worker = this.workers.find((w) => w.isIdle);
                if (worker) {
                    worker.isIdle = false;
                    worker.postMessage(nextTask);
                }
                else {
                    // Something went wrong, there are no idle workers somehow
                    throw Error('Could not find an idle worker.');
                }
            }
        }
        else if (this.isComplete() && this.completeResolve) {
            this.completeResolve();
            this.completePromise = undefined;
            this.completeResolve = undefined;
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
}
exports.WorkerPool = WorkerPool;
