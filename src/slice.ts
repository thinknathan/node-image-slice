#!/usr/bin/env node

import * as yargs from 'yargs';
import * as os from 'os';

import { sliceImage } from './utils/processImage';
import { processPath } from './utils/processPath';

async function main() {
	// console.time('Done in');

	// Parse command line arguments
	const options = (await yargs(process.argv.slice(2))
		.option('f', {
			alias: 'filename',
			describe: 'Input image filename',
			type: 'string',
			coerce: (value: string | string[]) => {
				if (Array.isArray(value)) {
					value = value.join('');
				}
				return value;
			},
		})
		.option('i', {
			alias: 'folderPath',
			describe: 'Input folder',
			type: 'string',
			coerce: (value: string | string[]) => {
				if (Array.isArray(value)) {
					value = value.join('');
				}
				return value;
			},
		})
		.option('w', {
			alias: 'width',
			describe: 'Width of each slice',
			type: 'number',
			demandOption: true,
			coerce: (value: number) => {
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
			coerce: (value: number) => {
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
			coerce: (value: number) => {
				if (value !== undefined && value < 1) {
					throw new Error('canvasWidth should not be lower than 1');
				}
				return Math.round(value);
			},
		})
		.option('g', {
			alias: 'canvasHeight',
			describe: 'Height of canvas for final output',
			type: 'number',
			coerce: (value: number) => {
				if (value !== undefined && value < 1) {
					throw new Error('canvasHeight should not be lower than 1');
				}
				return Math.round(value);
			},
		})
		.option('s', {
			alias: 'scale',
			describe:
				'Rescale the image up or down by this factor, after slicing, but before canvas resize',
			type: 'number',
			default: 1,
			coerce: (value: number) => {
				if (value <= 0) {
					throw new Error('scale should be > 0');
				}
				return value;
			},
		})
		.option('c', {
			alias: 'cubic',
			describe:
				'Uses bicubic interpolation instead of nearest neighbour if rescaling',
			type: 'boolean',
			default: false,
		})
		.parse()) as unknown as Options;

	if (options.filename) {
		// Process a single image
		sliceImage(options);
	} else if (options.folderPath) {
		// Process all images in a folder, splitting the task into threads
		let numCores = 1;
		try {
			numCores = os.cpus().length;
		} catch (err) {
			console.error(err);
		}
		numCores = Math.max(numCores - 1, 1); // Min 1
		numCores = Math.min(numCores, 32); // Max 32
		await processPath(options.folderPath, options, numCores);
	} else {
		console.error(
			'Error: Requires either `filename` or `folderPath`. Run `slice --help` for help.',
		);
	}
	// console.timeEnd('Done in');
}

void main();
