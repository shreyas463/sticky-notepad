// Simple script to create basic icons for the extension
// This will be executed with Node.js

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon for the notepad
function createSvgIcon(size) {
  // Define colors
  const bgColor = '#4285f4'; // Google blue
  const lineColor = '#ffffff';
  
  // Create SVG content
  const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="${size-8}" height="${size-8}" rx="4" fill="${bgColor}" />
  <line x1="10" y1="${size/3}" x2="${size-10}" y2="${size/3}" stroke="${lineColor}" stroke-width="2" />
  <line x1="10" y1="${size/2}" x2="${size-10}" y2="${size/2}" stroke="${lineColor}" stroke-width="2" />
  <line x1="10" y1="${2*size/3}" x2="${size-10}" y2="${2*size/3}" stroke="${lineColor}" stroke-width="2" />
</svg>`;

  return svg;
}

// Create icons of different sizes
const sizes = [16, 48, 128];

sizes.forEach(size => {
  const svg = createSvgIcon(size);
  fs.writeFileSync(path.join(__dirname, `icon${size}.svg`), svg);
  console.log(`Created icon${size}.svg`);
});

console.log('Icon creation complete. Convert SVGs to PNG if needed for production use.');
