const sharp = require('sharp');

async function check() {
  const metadata = await sharp('./public/icon.png').metadata();
  console.log(metadata);
}
check();
