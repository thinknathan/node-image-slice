#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const yargs = require('yargs');
const os = require('os');
const processImage_1 = require('./utils/processImage');
const processPath_1 = require('./utils/processPath');
// Parse command line arguments
const options = yargs
	.option('f', {
		alias: 'filename',
		describe: 'Input image filename',
		type: 'string',
	})
	.option('i', {
		alias: 'folderPath',
		describe: 'Input folder',
		type: 'string',
	})
	.option('w', {
		alias: 'width',
		describe: 'Width of each slice',
		type: 'number',
		demandOption: true,
		coerce: (value) => {
			if (value < 1) {
				throw new Error('width should not be lower than 1');
			}
			return Math.round(value);
		},
	})
	.option('h', {
		alias: 'height',
		describe: 'Height of each slice',
		type: 'number',
		coerce: (value) => {
			if (value !== undefined && value < 1) {
				throw new Error('height should not be lower than 1');
			}
			return Math.round(value);
		},
	})
	.option('d', {
		alias: 'canvasWidth',
		describe: 'Width of canvas for final output',
		type: 'number',
	})
	.option('g', {
		alias: 'canvasHeight',
		describe: 'Height of canvas for final output',
		type: 'number',
	}).argv;
if (options.filename) {
	// Process a single image
	const { filename, width, height, canvasWidth, canvasHeight } = options;
	(0, processImage_1.sliceImage)(
		filename,
		width,
		height,
		canvasWidth,
		canvasHeight,
	);
} else if (options.folderPath) {
	// Process all images in a folder, splitting the task into threads
	let numCores = 2;
	try {
		numCores = os.cpus().length;
	} catch (err) {
		console.error(err);
	}
	numCores = Math.max(numCores - 1, 1);
	(0, processPath_1.processPath)(options.folderPath, options, numCores);
} else {
	console.log(
		'Requires either `filename` or `folderPath`. Run `slice --help` for help.',
	);
}
