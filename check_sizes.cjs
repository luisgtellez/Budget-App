const fs = require('fs');
console.log('apple-touch-icon.png:', fs.statSync('./public/apple-touch-icon.png').size);
console.log('icon-192.png:', fs.statSync('./public/icon-192.png').size);
console.log('icon-512.png:', fs.statSync('./public/icon-512.png').size);
console.log('icon.png:', fs.statSync('./public/icon.png').size);
