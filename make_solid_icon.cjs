const sharp = require('sharp');

sharp('./public/logo-final.png')
  .resize(180, 180)
  .flatten({ background: { r: 9, g: 9, b: 11 } }) // #09090b
  .png({ quality: 100 })
  .toFile('./public/apple-touch-icon-solid.png')
  .then(info => console.log('Solid icon created:', info))
  .catch(err => console.error('Error creating solid icon:', err));
