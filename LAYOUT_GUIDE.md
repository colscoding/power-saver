# Layout System Guide

The Power Saver app now includes **6 different layout options** to customize how your metrics are displayed. Choose the layout that best fits your riding style and display preferences.

## Available Layouts

### 1. 📊 Classic (Default)
**Description:** Large power display with smaller side metrics

**Best For:**
- Traditional power meter users
- When power is your primary focus
- Training with power zones

**Features:**
- Extra-large power display (6rem font)
- Compact heart rate and cadence displays on the side
- Grid ratio: 2:1:1 (Power takes 50% of width)

---

### 2. ⚖️ Balanced
**Description:** Equal size cards for all metrics

**Best For:**
- Monitoring all metrics equally
- Multi-sport athletes
- Balanced training focus

**Features:**
- All metrics same size (4.5rem font)
- Equal visual weight for each card
- Grid ratio: 1:1:1 (each metric gets 33% width)

---

### 3. 📱 Vertical Stack
**Description:** Single column with full-width cards

**Best For:**
- Narrow screens or phones
- Portrait orientation displays
- Maximum readability

**Features:**
- Stacked layout, one card per row
- Large readable values (5rem power, 4rem others)
- Ideal for mobile devices

---

### 4. 📦 Compact
**Description:** Dense layout for more screen space

**Best For:**
- Small screens
- When you need room for additional sensors
- Minimizing app footprint

**Features:**
- Smaller fonts and padding
- More compact cards with rounded corners
- Grid ratio: 1:1:1 with reduced spacing

---

### 5. ⚡ Power Focus
**Description:** Maximize power display, minimize others

**Best For:**
- Power-based training sessions
- Time trials and intervals
- When only power matters

**Features:**
- Massive power display (8rem font)
- HR and cadence stacked vertically on the side
- Grid ratio: 3:1 (Power takes 75% of width)
- Minimal secondary metrics

---

### 6. ✨ Minimal
**Description:** Clean minimal design with subtle cards

**Best For:**
- Aesthetic preference
- Reducing visual clutter
- Modern minimalist look

**Features:**
- Transparent card backgrounds
- Subtle borders instead of filled cards
- Hover effects for interactivity
- Clean, spacious design

---

## How to Change Layout

### Method 1: Using the Menu
1. Click the **hamburger menu** (☰) in the top right corner
2. Select **"📐 Change Layout"**
3. Click on your preferred layout from the grid
4. The layout applies instantly

### Method 2: Keyboard Shortcut
Currently, layouts are changed via the menu only. Keyboard shortcuts may be added in future updates.

---

## Layout Persistence

Your layout choice is **automatically saved** to your browser's local storage and will persist across:
- Page refreshes
- Browser restarts
- Different sessions

To reset to default, simply select "Classic" from the layout menu.

---

## Layout Details

### Font Sizes by Layout

| Layout | Power | Heart Rate | Cadence |
|--------|-------|------------|---------|
| Classic | 6rem | 3rem | 3rem |
| Balanced | 4.5rem | 4.5rem | 4.5rem |
| Vertical | 5rem | 4rem | 4rem |
| Compact | 3.5rem | 2.5rem | 2.5rem |
| Power Focus | 8rem | 2rem | 2rem |
| Minimal | 5rem | 3.5rem | 3.5rem |

### Grid Templates

| Layout | Grid Structure | Description |
|--------|---------------|-------------|
| Classic | `2fr 1fr 1fr` | Power is 2x wider than others |
| Balanced | `1fr 1fr 1fr` | All equal width |
| Vertical | `1fr` | Single column |
| Compact | `1fr 1fr 1fr` | All equal, minimal spacing |
| Power Focus | `3fr 1fr` | Power 3x wider, others stacked |
| Minimal | `1fr 1fr 1fr` | All equal with minimal styling |

---

## Responsive Behavior

All layouts automatically adapt to different screen sizes:

### Desktop (>768px)
- Layouts display as configured
- Full grid layouts with all features

### Tablet (481px - 768px)
- Layout selector shows 2 columns
- Some layouts adjust proportions
- Maintains readability

### Mobile (<480px)
- Layout selector shows 1 column
- Vertical stack recommended for best experience
- Automatic grid simplification

---

## Combining Layouts with Themes

Layouts work seamlessly with all 8 themes:
- **Neon Nights** theme + **Minimal** layout = Ultra-modern look
- **Clean Light** theme + **Balanced** layout = Professional dashboard
- **Dark Elegance** theme + **Classic** layout = Traditional power meter
- **Forest Green** theme + **Vertical** layout = Mobile-optimized nature view

Try different combinations to find your perfect setup!

---

## Tips for Choosing a Layout

### For Training
- **Intervals:** Power Focus or Classic
- **Endurance:** Balanced or Vertical
- **Recovery:** Minimal or Compact

### For Racing
- **Time Trials:** Power Focus
- **Road Races:** Classic or Balanced
- **Criteriums:** Compact (more screen space)

### For Different Devices
- **Large Monitor:** Classic or Balanced
- **Laptop:** Classic or Minimal
- **Tablet:** Balanced or Vertical
- **Phone:** Vertical or Compact

---

## Advanced Layout Features

### Special Behaviors

**Power Focus Layout:**
- Automatically creates a stacked container for secondary metrics
- HR and Cadence cards move into a vertical stack
- Power card expands to fill most of the screen

**Minimal Layout:**
- Removes card backgrounds for transparency
- Adds hover effects for subtle interactivity
- Border-only design reduces visual weight

**Compact Layout:**
- Reduces all padding and spacing
- Smaller font sizes throughout
- Optimized for maximum information density

---

## Troubleshooting

### Layout Not Applying
1. Refresh the page
2. Check browser console for errors
3. Clear localStorage and try again
4. Ensure JavaScript is enabled

### Layout Looks Broken
1. Try a different layout
2. Check screen size and orientation
3. Disable browser extensions that might interfere
4. Test in a different browser

### Layout Not Saving
1. Ensure cookies/localStorage are enabled
2. Check browser privacy settings
3. Try in a different browser window

---

## Accessibility

All layouts maintain:
- ✅ High contrast ratios
- ✅ Readable font sizes
- ✅ Touch-friendly button sizes
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility

---

## Future Enhancements

Planned features for future updates:
- Custom layout editor
- Layout presets for specific training types
- Keyboard shortcuts for quick layout switching
- Layout sharing via URL parameters
- Animated transitions between layouts

---

## Technical Details

### Implementation
- Pure CSS Grid for layouts
- JavaScript for dynamic sizing
- LocalStorage for persistence
- Modular design for easy extension

### Browser Support
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

### Performance
- Zero layout shift on load
- Instant layout switching
- No performance impact
- Smooth transitions

---

## Related Features

- **Themes:** Change the color scheme (🎨 Change Theme)
- **Metric Toggles:** Show/hide specific metrics
- **Additional Sensors:** Connect multiple sensors of each type
- **Power Averages:** View power averaging tables

---

## Feedback

Found the perfect layout for your riding style? Have suggestions for new layouts? Let us know!

**Current version:** 1.0.0  
**Last updated:** October 2025
