#!/usr/bin/env python3
"""
Simple icon generator using Python PIL/Pillow
Converts SVG to PNG icons in various sizes
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os

    sizes = [72, 96, 128, 144, 152, 192, 384, 512]

    print("Generating PWA icons using PIL...")

    for size in sizes:
        # Create a new image with transparency
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Draw outer circle (green)
        margin = size // 20
        draw.ellipse([margin, margin, size - margin, size - margin], fill="#00ff00")

        # Draw inner circle (dark)
        inner_margin = size // 5
        draw.ellipse(
            [inner_margin, inner_margin, size - inner_margin, size - inner_margin],
            fill="#1a1a1a",
        )

        # Draw lightning bolt (simplified)
        bolt_points = [
            (size * 0.55, size * 0.23),  # top
            (size * 0.39, size * 0.51),  # middle left
            (size * 0.49, size * 0.51),  # middle center
            (size * 0.45, size * 0.77),  # bottom left
            (size * 0.66, size * 0.43),  # middle right
            (size * 0.55, size * 0.43),  # middle center-right
        ]
        draw.polygon(bolt_points, fill="#00ff00")

        # Save the image
        filename = f"icon-{size}x{size}.png"
        img.save(filename, "PNG")
        print(f"Created: {filename}")

    print("\nAll icons generated successfully!")
    print("\nTo use your own design:")
    print("1. Create a 512x512 PNG with your design")
    print("2. Use an online tool like https://www.pwabuilder.com/imageGenerator")

except ImportError:
    print("PIL/Pillow is not installed.")
    print("Install it with: pip install Pillow")
    print("\nAlternatively, use an online icon generator:")
    print("https://www.pwabuilder.com/imageGenerator")
