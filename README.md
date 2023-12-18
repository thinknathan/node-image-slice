# node-image-slice

Command-line utility that slices an input image into segments according to specified width and height, and outputs those segments into a folder.

## Usage

`node slice.cjs <filename> <width> [height]`

- If `filename` does not include an extension, `.png` will be guessed
- If `height` is not specified, `width` will be used as `height`

## Supported formats

- jpeg
- png
- bmp
- tiff
- gif

## Background

Created with Chat-GPT 3.5.
