const fs = require('fs');
const file = fs.readFileSync('./public/apple-touch-icon.png');
console.log('Size:', file.length);
// console.log('Base64:', file.toString('base64').substring(0, 100) + '...');
