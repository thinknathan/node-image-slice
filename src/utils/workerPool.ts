import { Worker } from 'worker_threads';
import * as path from 'path';

/**
 * Manages a pool of worker threads for parallel processing of image files.
 */
export class WorkerPool {
	private workers: Worker[] = [];
	private taskQueue: { filePath: string; options: Options }[] = [];
	private maxWorkers: number;

	/**
	 * Creates a new WorkerPool instance.
	 *
	 * @param maxWorkers - The maximum number of worker threads in the pool.
	 */
	constructor(maxWorkers: number) {
		this.maxWorkers = maxWorkers;
	}

	/**
	 * Creates a worker thread for processing a specific file with given options.
	 *
	 * @param filePath - The path of the file to process.
	 * @param options - Image processing options for the file.
	 */
	private createWorker(filePath: string, options: Options): void {
		const worker = new Worker(path.join(__dirname, 'processImage.js'), {
			workerData: { filePath, options },
		});

		// Listen for messages and errors from the worker
		worker.on('message', (message) => {
			console.log(message);
			this.processNextTask();
		});

		worker.on('error', (err) => {
			console.error(`Error in worker for file ${filePath}:`, err);
			this.processNextTask();
		});

		this.workers.push(worker);
	}

	/**
	 * Processes the next task in the queue.
	 */
	private processNextTask(): void {
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
	public addTask(filePath: string, options: Options): void {
		if (this.workers.length < this.maxWorkers) {
			this.createWorker(filePath, options);
		} else {
			this.taskQueue.push({ filePath, options });
		}
	}

	/**
	 * Waits for all tasks to complete before exiting.
	 */
	public waitForCompletion(): void {
		this.workers.forEach((worker) => {
			worker.on('exit', () => {
				this.processNextTask();
			});
		});
	}
}
