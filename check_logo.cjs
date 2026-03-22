const fs = require('fs');
try {
  const stats = fs.statSync('./public/logo-final.png');
  console.log('Size:', stats.size);
} catch (e) {
  console.log('Error:', e.message);
}
