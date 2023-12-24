# node-image-slice

Command-line utility that slices input images into segments according to specified width and height, and outputs those segments into a folder.

## Install

1. Install [Nodejs](https://nodejs.org/en) or equivalent

2. Clone this project
   `git clone https://github.com/thinknathan/node-image-slice`

3. Install dependencies
   `npm i`
   or
   `yarn`

## Usage

`node slice.cjs`

```
-f, --filename      Input image filename                              [string]
-i, --folderPath    Input folder                                      [string]
-w, --width         Width of each slice                    [number] [required]
-h, --height        Height of each slice                              [number]
-d, --canvasWidth   Width of canvas for final output                  [number]
-g, --canvasHeight  Height of canvas for final output                 [number]
-s, --scale         Rescale the image up or down by this factor, after
										slicing, but before canvas resize    [number] [default: 1]
-c, --cubic         Uses bicubic interpolation instead of nearest neighbour if
										rescaling                       [boolean] [default: false]
```

- If `filename` does not include an extension, `.png`, `.gif`, `.jpg` and `.jpeg` will be guessed
- Valid input formats: `jpeg`, `png`, `bmp`, `tiff`, `gif`
- Output format is `.png`
- If `height` is not specified, `width` will be used as `height`

## Background

Created with Chat-GPT 3.5.
