import * as Jimp from 'jimp';
import * as fs from 'fs';
import * as path from 'path';
import { parentPort, isMainThread } from 'worker_threads';

function errorCallback(err: unknown) {
	if (err) {
		console.error(err);
	}
}

const workIsDone = () => parentPort?.postMessage('complete');

/**
 * Function to slice an image into smaller segments
 */
export function sliceImage(options: Options, skipExtCheck?: boolean): void {
	const { filename } = options;
	Jimp.read(filename!)
		.then((image) => {
			// Continue slicing if image is successfully read
			if (image) {
				skipExtCheck = true;
				continueSlicing(image, options);
			}
		})
		.catch((err) => {
			if (skipExtCheck) {
				console.error(err);
			}
		})
		.finally(() => {
			if (skipExtCheck) {
				return;
			}

			// Check for supported image formats if skipExtCheck is false
			const supportedFormats = ['.png', '.gif', '.jpg', '.jpeg'];
			let foundImage = false;

			// Attempt to read the image with different extensions
			const promises = supportedFormats.map((ext) => {
				const fullFilename = filename + ext;
				return (
					Jimp.read(fullFilename)
						.then((image) => {
							foundImage = true;
							continueSlicing(image, options);
						})
						// Silence errors since we'll handle them later
						.catch(() => {})
				);
			});

			// Wait for all promises to be resolved
			Promise.all(promises)
				.then(() => {
					if (!foundImage) {
						console.error(`Error: Could not find ${filename}`);
					}
				})
				.catch(errorCallback);
		});
}

/**
 * Continue slicing the image into smaller segments
 */
function continueSlicing(image: Jimp, options: Options): void {
	const { filename, width, canvasWidth, canvasHeight, scale, cubic } = options;
	// If height is not specified, use width as height
	const height = options.height || options.width;

	const imageWidth = image.getWidth();
	const imageHeight = image.getHeight();

	// Calculate the number of slices in both dimensions
	const horizontalSlices = Math.ceil(imageWidth / width);
	const verticalSlices = Math.ceil(imageHeight / height);

	// Create a folder for output if it doesn't exist
	const outputFolder = 'output';
	if (!fs.existsSync(outputFolder)) {
		fs.mkdirSync(outputFolder);
	}

	// Slice the image and save each segment
	for (let y = 0; y < verticalSlices; y++) {
		for (let x = 0; x < horizontalSlices; x++) {
			const startX = x * width;
			const startY = y * height;

			const sliceWidth = Math.min(width, imageWidth - startX);
			const sliceHeight = Math.min(height, imageHeight - startY);

			const slice = image.clone().crop(startX, startY, sliceWidth, sliceHeight);

			// Incorporate the input filename into the output filename
			const baseFilename = path.basename(filename!, path.extname(filename!));
			const outputFilename = `${outputFolder}/${baseFilename}_${x}_${y}.png`;

			if (canvasWidth || canvasHeight) {
				// Calculate canvas dimensions
				const finalCanvasWidth = canvasWidth || width;
				const finalCanvasHeight = (canvasHeight || canvasWidth) ?? height;

				// Create a new canvas with transparent background
				const canvas = new Jimp(
					finalCanvasWidth,
					finalCanvasHeight,
					0x00000000,
				);

				// Composite the image in the middle of the canvas
				const startX2 = Math.floor((finalCanvasWidth - sliceWidth) / 2);
				const startY2 = Math.floor((finalCanvasHeight - sliceHeight) / 2);
				canvas.composite(slice, startX2, startY2);
				if (scale !== 1) {
					canvas.scale(
						scale,
						cubic ? Jimp.RESIZE_BICUBIC : Jimp.RESIZE_NEAREST_NEIGHBOR,
					);
				}
				canvas.write(outputFilename, errorCallback);
			} else {
				if (scale !== 1) {
					slice.scale(
						scale,
						cubic ? Jimp.RESIZE_BICUBIC : Jimp.RESIZE_NEAREST_NEIGHBOR,
					);
				}
				slice.write(outputFilename, errorCallback);
			}

			console.log(`Slice saved: ${outputFilename}`);
		}
	}

	if (!isMainThread) {
		workIsDone();
	}
}

// If used as a worker thread, get file name from message
if (!isMainThread) {
	parentPort?.on(
		'message',
		async (message: { filePath: string; options: Options }) => {
			const { filePath, options } = message;
			options.filename = filePath;
			sliceImage(options, true);
		},
	);
}
