"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sliceImage = void 0;
const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");
const worker_threads_1 = require("worker_threads");
const outputFolder = 'output';
/**
 * Function to slice an image into smaller segments
 */
function sliceImage(filename, width, height, skipExtCheck) {
    Jimp.read(filename, (err, image) => {
        if (err && skipExtCheck) {
            console.error(err);
        }
        else {
            // Continue slicing if image is successfully read
            if (image) {
                continueSlicing(image, width, height, filename);
                return;
            }
        }
    });
    if (skipExtCheck) {
        return;
    }
    // Check for supported image formats if skipExtCheck is false
    const supportedFormats = ['.png', '.gif', '.jpg', '.jpeg'];
    let foundImage = false;
    // Attempt to read the image with different extensions
    supportedFormats.forEach((ext) => {
        const fullFilename = filename + ext;
        if (!foundImage) {
            Jimp.read(fullFilename, (err, image) => {
                if (!foundImage && !err) {
                    foundImage = true;
                    continueSlicing(image, width, height, fullFilename);
                }
            });
        }
    });
}
exports.sliceImage = sliceImage;
/**
 * Continue slicing the image into smaller segments
 */
function continueSlicing(image, width, height, inputFilename) {
    // If height is not specified, use width as height
    height = height || width;
    const imageWidth = image.getWidth();
    const imageHeight = image.getHeight();
    // Calculate the number of slices in both dimensions
    const horizontalSlices = Math.ceil(imageWidth / width);
    const verticalSlices = Math.ceil(imageHeight / height);
    // Create a folder for output if it doesn't exist
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
            slice.write(outputFilename);
            console.log(`Slice saved: ${outputFilename}`);
        }
    }
}
// If used as a worker thread, get file name from message
if (!worker_threads_1.isMainThread) {
    const { filePath, options } = worker_threads_1.workerData;
    options.filename = filePath;
    const { filename, width, height } = options;
    sliceImage(filename, width, height, true);
}
