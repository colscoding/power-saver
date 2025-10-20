#!/bin/bash
# Icon Generator for PWA
# This script generates all required icon sizes from a base icon

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is required but not installed."
    echo "Install it with: sudo apt-get install imagemagick"
    exit 1
fi

# Base icon file (you should replace this with your actual icon)
BASE_ICON="icon-base.png"

if [ ! -f "$BASE_ICON" ]; then
    echo "Creating a placeholder base icon..."
    # Create a simple placeholder icon with ImageMagick
    convert -size 512x512 xc:transparent \
        -fill "#00ff00" -draw "circle 256,256 256,50" \
        -fill "#1a1a1a" -draw "circle 256,256 256,100" \
        -fill "#00ff00" -font DejaVu-Sans-Bold -pointsize 120 \
        -gravity center -annotate +0+0 "⚡" \
        "$BASE_ICON"
    echo "Created placeholder icon: $BASE_ICON"
fi

# Icon sizes needed for PWA
SIZES=(72 96 128 144 152 192 384 512)

echo "Generating PWA icons..."

for size in "${SIZES[@]}"; do
    output="icon-${size}x${size}.png"
    convert "$BASE_ICON" -resize "${size}x${size}" "$output"
    echo "Created: $output"
done

echo "All icons generated successfully!"
echo ""
echo "To use your own icon:"
echo "1. Replace icon-base.png with your 512x512 PNG icon"
echo "2. Run this script again: ./generate-icons.sh"
