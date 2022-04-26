const { createCanvas, loadImage } = require('canvas'),
  fs = require('fs-extra'),
  args = require('minimist')(process.argv.slice(2)), // slicing args
  imgOutputDir = args['img-output-dir'], // img output directory
  jsonOutputDir = args['json-output-dir'], // json output directory
  padding = args['padding'] ?? 20, // padding for the icons
  srcs = args._; // list of sources

// returns the number of tiles of both sides of a square that can acommodate n icons
function getTilesPerSide(numberOfIcons) {
  let i = 0;
  while (i * i < numberOfIcons) i++;
  return i;
}

// returns biggest value from all width and heights from images
function getMaxImageSize(images) {
  let size = 0;
  images.forEach(({ width, height }) => {
    size = size < width ? width : size;
    size = size < height ? height : size;
  });
  return size;
}

// load images with canvas loadImage function
function getImages(files, sourcePath) {
  return Promise.all(
    files.map(async name => [name.split('.')[0], await loadImage(sourcePath + name)])
  );
}

// where dreams come true
async function generateIconMapAndAtlas(src) {
  const sourcePath = __dirname + '/' + src + '/',
    // read source folder
    files = fs.readdirSync(sourcePath);

  if (!files.length) {
    return console.error(`No files on source path '${sourcePath}'`);
  }

  const images = await getImages(files, sourcePath),
    // get biggest size to be tile size
    tileSize = padding + getMaxImageSize(images.map(img => img[1])),
    // number of tiles from number of files to make look like a square
    tilesPerSide = getTilesPerSide(files.length),
    // totalSize = tileSize * tilesPerSide
    totalSize = tileSize * tilesPerSide,
    // create canvas
    iconAtlasCanvas = createCanvas(totalSize, totalSize),
    // get canvas context aka iconAtlas
    iconAtlas = iconAtlasCanvas.getContext('2d'),
    // json output for icon mapping
    iconMapping = {};

  // here we go through each svg, "measure them" and add to the the outputs
  images.forEach(([name, svg], i) => {
    const { width, height } = svg,
      // renders x always a tileSize away until it reaches end of row
      x = padding / 2 + tileSize * (i % tilesPerSide),
      // renders y always the same until next row
      y = padding / 2 + tileSize * Math.floor(i / tilesPerSide);

    // write json icon mapping
    iconMapping[name] = { x, y, width, height };
    // draw svg to icon atlas
    iconAtlas.drawImage(svg, x, y, width, height);
  });

  // makes sure folders exists
  fs.ensureDirSync(jsonOutputDir);
  // outputs icon mapping json
  fs.writeJSONSync(`${jsonOutputDir}/${src}.json`, iconMapping, { spaces: 2 });

  // makes sure folders exists
  fs.ensureDirSync(imgOutputDir);
  // outputs icon atlas png
  iconAtlasCanvas.createPNGStream().pipe(fs.createWriteStream(`${imgOutputDir}/${src}.png`));

  // :)
  console.log(`Icon map and atlas created for source '${src}'`);
}

// run the script for each src
srcs.forEach(src => {
  try {
    generateIconMapAndAtlas(src);
  } catch (error) {
    console.error(`Error generating icon map and atlas for source '${src}'`);
    console.error(error);
  }
});
