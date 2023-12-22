import * as fs from 'fs/promises';
import * as path from 'path';
import { WorkerPool } from './workerPool';

/**
 * Processes all files in the specified directory with the given image processing options.
 */
export async function processPath(
	directoryPath: string,
	options: Options,
	maxWorkers: number,
): Promise<void> {
	const workerPool = new WorkerPool(maxWorkers);

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

		// Wait for all tasks to complete before exiting
		workerPool.waitForCompletion();
	} catch (err) {
		console.error(`Error reading directory: ${directoryPath}`, err);
	}
}
