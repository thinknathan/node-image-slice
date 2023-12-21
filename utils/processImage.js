"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sliceImage = void 0;
const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");
const worker_threads_1 = require("worker_threads");
function errorCallback(err) {
    if (err) {
        console.error(err);
    }
}
/**
 * Function to slice an image into smaller segments
 */
function sliceImage(filename, width, height, canvasWidth, canvasHeight, scale, cubic, skipExtCheck) {
    Jimp.read(filename)
        .then((image) => {
        // Continue slicing if image is successfully read
        if (image) {
            skipExtCheck = true;
            continueSlicing(image, width, height, canvasWidth, canvasHeight, scale, cubic, filename);
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
            return (Jimp.read(fullFilename)
                .then((image) => {
                foundImage = true;
                continueSlicing(image, width, height, canvasWidth, canvasHeight, scale, cubic, fullFilename);
            })
                // Silence errors since we'll handle them later
                .catch(() => { }));
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
exports.sliceImage = sliceImage;
/**
 * Continue slicing the image into smaller segments
 */
function continueSlicing(image, width, height, canvasWidth, canvasHeight, scale, cubic, inputFilename) {
    console.time('Done in');
    // If height is not specified, use width as height
    height = height || width;
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
            const baseFilename = path.basename(inputFilename, path.extname(inputFilename));
            const outputFilename = `${outputFolder}/${baseFilename}_${x}_${y}.png`;
            if (canvasWidth || canvasHeight) {
                // Calculate canvas dimensions
                const finalCanvasWidth = canvasWidth || width;
                const finalCanvasHeight = (canvasHeight || canvasWidth) ?? height;
                // Create a new canvas with transparent background
                const canvas = new Jimp(finalCanvasWidth, finalCanvasHeight, 0x00000000);
                // Composite the image in the middle of the canvas
                const startX2 = Math.floor((finalCanvasWidth - sliceWidth) / 2);
                const startY2 = Math.floor((finalCanvasHeight - sliceHeight) / 2);
                canvas.composite(slice, startX2, startY2);
                if (scale !== 1) {
                    canvas.scale(scale, cubic ? Jimp.RESIZE_BICUBIC : Jimp.RESIZE_NEAREST_NEIGHBOR);
                }
                canvas.write(outputFilename, errorCallback);
            }
            else {
                if (scale !== 1) {
                    slice.scale(scale, cubic ? Jimp.RESIZE_BICUBIC : Jimp.RESIZE_NEAREST_NEIGHBOR);
                }
                slice.write(outputFilename, errorCallback);
            }
            console.log(`Slice saved: ${outputFilename}`);
        }
    }
    console.timeEnd('Done in');
}
// If used as a worker thread, get file name from message
if (!worker_threads_1.isMainThread) {
    const { filePath, options } = worker_threads_1.workerData;
    options.filename = filePath;
    const { filename, width, height, canvasWidth, canvasHeight, scale, cubic } = options;
    sliceImage(filename, width, height, canvasWidth, canvasHeight, scale, cubic, true);
}
