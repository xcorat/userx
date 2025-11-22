# Memeball Skins

This directory contains CSS skin files for the Memeball experience. Each skin defines a complete visual theme including colors, typography, effects, and decorative patterns.

## Current Skins

### Dark Hue (Default)
**File:** `dark-hue.css`

The default Memeball skin featuring a dark purple/space aesthetic with:
- Deep space background gradients
- Purple and pink nebula effects
- Subtle gridline patterns
- Emerald green for success/pick actions
- Red for destructive/reject actions
- High contrast text for readability

## How Skin System Works

### Static CSS Import
Unlike dynamic theme switching, Memeball uses **static CSS imports** for skins. The active skin is selected at build time by importing it in `src/app.css`:

```css
/* Import selected skin */
@import "./lib/styles/skins/dark-hue.css";
```

This approach:
- ✅ Zero runtime overhead
- ✅ Simpler implementation
- ✅ Better performance
- ✅ Easier to maintain
- ❌ Requires rebuild to change skins

### Design Token System

All skins build upon the base design token system defined in:
- `src/lib/styles/memeball-tokens.css` - Token definitions
- `src/lib/styles/memeball-base.css` - Common components

Each skin file overrides specific CSS variables to create its unique appearance.

## Creating a New Skin

### Step 1: Copy the Template

Start by copying `dark-hue.css` as a template:

```bash
cp src/lib/styles/skins/dark-hue.css src/lib/styles/skins/my-skin.css
```

### Step 2: Define Your Color Palette

Edit the CSS variables in your new skin file. Key variables to customize:

#### Essential Colors
```css
:root {
  /* Base colors - backgrounds and text */
  --memeball-background: #your-color;
  --memeball-foreground: #your-color;
  
  /* Surface colors - cards and overlays */
  --memeball-surface: rgba(your, colors, here, alpha);
  --memeball-card-background: rgba(your, colors, here, alpha);
  
  /* Action colors */
  --memeball-primary: #your-color;      /* Success/pick */
  --memeball-destructive: #your-color;  /* Reject */
  --memeball-accent: #your-color;       /* Highlights */
  
  /* Semantic colors */
  --memeball-success: #your-color;
  --memeball-error-text: #your-color;
  --memeball-warning: #your-color;
  --memeball-muted-foreground: #your-color;
}
```

#### Gradients
```css
/* Background gradients define the overall atmosphere */
--memeball-gradient-background: radial-gradient(...), linear-gradient(...);
--memeball-gradient-nebula: radial-gradient(...);

/* Action button gradients */
--memeball-gradient-primary: linear-gradient(...);
--memeball-gradient-destructive: linear-gradient(...);
```

#### Effects
```css
/* Shadow intensities */
--memeball-shadow-xl: 0 30px 120px rgba(your, shadow, color, alpha);

/* Pattern opacity */
--memeball-nebula-opacity: 0-1;
--memeball-gridline-opacity: 0-1;

/* Gridline colors */
--memeball-gridline-color-primary: rgba(your, color, here, alpha);
--memeball-gridline-color-secondary: rgba(your, color, here, alpha);
```

### Step 3: Customize Typography (Optional)

You can adjust font sizes for your skin's aesthetic:

```css
:root {
  --memeball-text-base: 0.9rem;
  --memeball-text-lg: 1.1rem;
  --memeball-text-2xl: 1.5rem;
  /* etc. */
}
```

### Step 4: Add Skin-Specific Overrides

Create custom styles for specific elements if needed:

```css
/* Example: custom transmission title styling */
.memeball-transmission-title {
  color: var(--your-custom-color);
  text-transform: none; /* Remove uppercase */
}
```

### Step 5: Test Your Skin

1. Import your new skin in `src/app.css`:
   ```css
   @import "./lib/styles/skins/my-skin.css";
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Test all Memeball pages:
   - `/memeball` - Entry page
   - `/memeball/transmission` - Boot sequence
   - `/memeball/main` - Main meme viewer
   - `/memeball/add` - Meme submission form

### Step 6: Verify Consistency

Ensure your skin works across:
- ✅ All state displays (loading, empty, error)
- ✅ Interactive elements (buttons, forms)
- ✅ Responsive breakpoints (mobile, tablet, desktop)
- ✅ Accessibility (sufficient contrast ratios)

## Skin Design Guidelines

### Color Accessibility
- **Text contrast:** Aim for WCAG AA compliance (4.5:1 for normal text)
- **Focus indicators:** Ensure interactive elements have visible focus states
- **Color blindness:** Don't rely solely on color to convey information

### Visual Hierarchy
- **Background:** Deepest/darkest layer
- **Surface:** Cards and panels above background
- **Foreground:** Text and primary content
- **Accent:** Highlights and calls to action

### Consistency
- Use semantic color variables consistently (primary = success, destructive = danger)
- Maintain gradient directions (135deg is common for action buttons)
- Keep shadow intensities proportional to elevation

### Performance
- Avoid complex gradients with many color stops
- Limit blur effects (heavy on GPU)
- Use opacity instead of alpha in colors when possible

## Skin Ideas

Here are some concepts for future skins:

### Light Hue
- Bright white/cream backgrounds
- Pastel nebula effects
- Softer shadows
- Higher contrast text

### Neon Hue
- Dark background with bright neon accents
- Cyan/magenta/yellow color palette
- Glowing effects
- High energy aesthetic

### Minimal Hue
- Monochromatic palette
- Minimal decorative effects
- Clean, simple gradients
- Focus on content

### Retro Hue
- CRT screen aesthetic
- Scanline effects
- Green/amber terminal colors
- Pixelated elements

## Variables Reference

For a complete list of all available CSS variables, see:
- `src/lib/styles/memeball-tokens.css`

Key categories:
- **Colors:** background, foreground, primary, secondary, accent, muted, borders
- **Typography:** font families, sizes, weights, line heights, letter spacing
- **Spacing:** padding/margin scales
- **Effects:** shadows, blur, backdrop blur, opacity
- **Border Radius:** corners and rounded elements
- **Animation:** durations and easing functions
- **Z-index:** layering system

## Troubleshooting

### Skin not applying
- Check that import path in `app.css` is correct
- Ensure CSS file syntax is valid (no missing semicolons/braces)
- Clear browser cache and rebuild: `npm run dev`

### Colors look wrong
- Verify CSS variable names match token names
- Check color format (hex, rgba, oklch)
- Ensure opacity values are between 0 and 1

### Gradients not showing
- Confirm gradient syntax is correct
- Check that color stops are in valid positions (0-100%)
- Verify background properties aren't being overridden

### Typography issues
- Font sizes use rem units (relative to root)
- Line heights are unitless or specific units
- Letter spacing uses em units (relative to font size)

## Contributing

When creating a new skin:
1. Test thoroughly across all pages and devices
2. Document any unique features or requirements
3. Include a comment block at the top describing the skin
4. Add entry to this README's "Current Skins" section

## Support

For questions about creating skins or reporting issues:
- Review existing skin files for examples
- Check `memeball-tokens.css` for available variables
- Consult the main Memeball documentation

