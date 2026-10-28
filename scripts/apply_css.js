const fs = require('fs');
const path = require('path');

const cssContent = fs.readFileSync(path.join(__dirname, 'premium.css'), 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'src', 'index.css'), cssContent);
console.log('Done. Written', cssContent.length, 'bytes to src/index.css');
