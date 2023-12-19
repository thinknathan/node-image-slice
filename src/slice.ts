import * as Jimp from "jimp";
import * as fs from "fs";
import * as path from "path";

const outputFolder = "output";

function sliceImage(filename: string, width: number, height?: number): void {
  Jimp.read(filename, (err, image) => {
    if (err) {
      // Try again by appending '.png' to the filename
      const pngFilename = `${filename}.png`;
      Jimp.read(pngFilename, (pngErr, pngImage) => {
        if (pngErr) {
          console.error("Error reading the image:", pngErr);
          return;
        }
        continueSlicing(pngImage, width, height, filename);
      });
    } else {
      continueSlicing(image, width, height, filename);
    }
  });
}

function continueSlicing(
  image: Jimp,
  width: number,
  height: number | undefined,
  inputFilename: string,
): void {
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
      const baseFilename = path.basename(
        inputFilename,
        path.extname(inputFilename),
      );
      const outputFilename = `${outputFolder}/${baseFilename}_${x}_${y}.png`;

      slice.write(outputFilename);
      console.log(`Slice saved: ${outputFilename}`);
    }
  }
}

// Get input from the command line arguments
const [filename, width, height] = process.argv.slice(2);

if (!filename || !width) {
  console.log("Usage: node slice.cjs <filename> <width> [height]");
} else {
  sliceImage(filename, parseInt(width), parseInt(height));
}
