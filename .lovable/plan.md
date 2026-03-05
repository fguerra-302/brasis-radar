

## Problem

Buttons across the app have poor contrast against the beige background (`hsl(42 50% 89%)`). The main issues:

1. **`outline` variant**: Uses `border-primary bg-background text-primary` -- orange text on beige background is hard to read
2. **`ghost` variant**: Uses `hover:bg-accent` -- the hover state works but the default state has no visual weight
3. **`default` / `brasis` variant**: Uses `bg-gradient-brasis` (orange-to-blue gradient) with white text -- this actually has good contrast, but the gradient makes some buttons look washed out
4. **Inline overrides**: Many buttons use custom classes like `bg-secondary hover:bg-secondary/90 text-secondary-foreground` which works, but `outline` buttons with `text-primary` (orange) on beige are the worst offenders

## Plan

### Fix button variants in `src/components/ui/button.tsx`

- **`outline`**: Change from `text-primary` to `text-foreground` (dark blue) and add a stronger border. This ensures text is always readable against beige or white backgrounds.
  - New: `border-2 border-primary/60 bg-background text-foreground hover:bg-primary hover:text-white`
  
- **`default`**: Replace gradient with solid orange for clarity.
  - New: `bg-primary text-white shadow-brasis hover:bg-primary/90 hover:-translate-y-0.5`

- **`brasis`**: Keep gradient but ensure it's distinct from default.
  - Keep as-is (gradient with white text works)

- **`secondary`**: Already has white foreground on blue -- fine, no change needed.

- **`ghost`**: Add `text-foreground` explicitly so it's not inherited as the same beige-ish tone.
  - New: `text-foreground hover:bg-accent hover:text-accent-foreground`

### No other files need changes
The button component is centralized -- fixing the variants here fixes all 35+ files using these buttons. Inline overrides (like `text-destructive border-destructive/30`) already have good contrast and should be left alone.

