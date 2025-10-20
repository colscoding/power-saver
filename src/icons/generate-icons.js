const fs = require('fs');
const { createCanvas } = require('canvas');

/**
 * Generate PWA icons using Node.js Canvas
 * Run: node generate-icons.js
 */

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function generateIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background circle (green)
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
    ctx.fill();

    // Inner circle (dark)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 40, 0, Math.PI * 2);
    ctx.fill();

    // Lightning bolt emoji (approximation with text)
    ctx.fillStyle = '#00ff00';
    ctx.font = `bold ${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', size / 2, size / 2);

    // Save to file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`icon-${size}x${size}.png`, buffer);
    console.log(`Created: icon-${size}x${size}.png`);
}

console.log('Generating PWA icons...');

try {
    sizes.forEach(size => generateIcon(size));
    console.log('All icons generated successfully!');
} catch (error) {
    console.error('Error generating icons:', error.message);
    console.log('\nTo install canvas dependency, run:');
    console.log('npm install canvas');
    console.log('\nOr use an online tool like https://www.pwabuilder.com/imageGenerator');
}
