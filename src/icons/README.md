# PWA Icons

This directory contains the icons needed for the Progressive Web App.

## Quick Setup - Online Tool (Recommended)

The easiest way to generate all required icons is to use an online tool:

1. **PWA Builder Image Generator**: https://www.pwabuilder.com/imageGenerator
   - Upload a 512x512 PNG image
   - Download the generated icon pack
   - Extract and replace the icons in this folder

2. **Favicon Generator**: https://realfavicongenerator.net/
   - Upload your base icon
   - Configure settings
   - Download and extract

## Manual Generation

### Option 1: Using ImageMagick (Linux/Mac)

```bash
cd src/icons
chmod +x generate-icons.sh
./generate-icons.sh
```

### Option 2: Using Node.js Canvas

```bash
npm install canvas
cd src/icons
node generate-icons.js
```

### Option 3: Manual Creation

Create PNG icons with these dimensions:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512 (maskable)

Name them as `icon-{size}x{size}.png`

## Design Guidelines

For best results:
- Use a simple, recognizable design
- Ensure the icon works at small sizes (72x72)
- Use your brand colors
- For maskable icons (512x512), keep important content in the center 80%
- Test on both light and dark backgrounds

## Current Icon

The placeholder icon features:
- Lightning bolt symbol (⚡) representing power/energy
- Green (#00ff00) on dark background (#1a1a1a)
- Matches the app's theme color

Replace with your own branded icon for production use!
