const http = require('http');
http.get('http://localhost:3000/apple-touch-icon.png', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers['content-type']);
});
