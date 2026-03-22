const sharp = require('sharp');
sharp('./public/ios-icon-v5.png')
  .png({ quality: 60, compressionLevel: 9 })
  .toFile('./public/ios-icon-compressed.png')
  .then(info => console.log('Compressed size:', info.size))
  .catch(err => console.error(err));
