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
-f, --filename    Input image filename                                [string]
-i, --folderPath  Input folder                                        [string]
-w, --width       Output image width                       [number] [required]
-h, --height      Output image height                                 [number]
```

- If `filename` does not include an extension, `.png`, `.gif`, `.jpg` and `.jpeg` will be guessed
- If `height` is not specified, `width` will be used as `height`

## Background

Created with Chat-GPT 3.5.
