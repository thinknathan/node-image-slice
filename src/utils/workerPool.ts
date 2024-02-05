import { Worker } from 'worker_threads';
import * as path from 'path';

type TWorker = Worker & { isIdle: boolean };

/**
 * Manages a pool of worker threads for parallel processing of image files.
 */
export class WorkerPool {
	private workers: TWorker[] = [];
	private taskQueue: { filePath: string; options: Options }[] = [];
	private maxWorkers: number;
	private completePromise?: Promise<void>;
	private completeResolve?: () => void;
	private isComplete(): boolean {
		return (
			this.taskQueue.length === 0 &&
			this.workers.every((worker) => worker.isIdle)
		);
	}

	/**
	 * Terminate all workers in the pool.
	 */
	public exitAll(): void {
		this.workers.forEach((worker) => worker.terminate());
		this.workers = [];
	}

	/**
	 * Returns a promise that resolves when all work is done.
	 */
	public async allComplete(): Promise<void> {
		if (this.isComplete()) {
			return Promise.resolve();
		}

		if (!this.completePromise) {
			this.completePromise = new Promise<void>((resolve) => {
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
		const worker = new Worker(
			path.join(__dirname, 'processImage.js'),
		) as TWorker;

		worker.postMessage({ filePath, options });
		worker.isIdle = false;

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
	private processNextTask(): void {
		const nextTask = this.taskQueue.shift();
		if (nextTask) {
			if (this.workers.length < this.maxWorkers) {
				this.createWorker(nextTask.filePath, nextTask.options);
			} else {
				const worker = this.workers.find((w) => w.isIdle);
				if (worker) {
					worker.postMessage(nextTask);
				} else {
					// Something went wrong, there are no idle workers somehow
					throw Error('Could not find an idle worker.');
				}
			}
		} else if (this.isComplete() && this.completeResolve) {
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
	public addTask(filePath: string, options: Options): void {
		if (this.workers.length < this.maxWorkers) {
			this.createWorker(filePath, options);
		} else {
			this.taskQueue.push({ filePath, options });
		}
	}
}
