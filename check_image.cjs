const sharp = require('sharp');

async function check() {
  const buffer = await sharp('./public/icon.png')
    .resize(32, 32)
    .toBuffer();
  console.log('data:image/png;base64,' + buffer.toString('base64'));
}
check();
