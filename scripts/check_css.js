/* BGI ALUMENTO - PREMIUM CSS - written via script */
const fs = require('fs');
const path = require('path');
const cssPath = path.join(__dirname, '..', 'src', 'index.css');
const css = fs.readFileSync(cssPath, 'utf8');
console.log('Lines:', css.split('\n').length);
