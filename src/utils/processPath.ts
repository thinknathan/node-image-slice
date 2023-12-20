import * as fs from 'fs';
import * as path from 'path';
import { WorkerPool } from './workerPool';

/**
 * Processes all files in the specified directory with the given image processing options.
 */
export function processPath(
	directoryPath: string,
	options: Options,
	maxWorkers: number,
): void {
	const workerPool = new WorkerPool(maxWorkers);

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
