const fs = require('fs');
const iconData = fs.readFileSync('./public/apple-touch-icon.png');
const base64Icon = iconData.toString('base64');
const dataUri = `data:image/png;base64,${base64Icon}`;

let html = fs.readFileSync('./index.html', 'utf8');
html = html.replace(
  /<link rel="apple-touch-icon" .*?>/,
  `<link rel="apple-touch-icon" href="${dataUri}" />`
);
html = html.replace(
  /<link rel="apple-touch-icon-precomposed" .*?>/,
  `<link rel="apple-touch-icon-precomposed" href="${dataUri}" />`
);

fs.writeFileSync('./index.html', html);
console.log('Injected base64 icon into index.html');
