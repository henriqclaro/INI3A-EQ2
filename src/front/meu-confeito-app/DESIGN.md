---
name: Meu Confeito
colors:
  # Base & Surfaces
  background: '#F6EDDC'
  surface: '#F6EDDC'
  surface-variant: '#FFFFFF'
  on-surface: '#40242B'
  on-surface-variant: '#F6EDDC'
  
  # Primary (Berry / Dark Pink)
  primary: '#C53557'
  on-primary: '#FFFFFF'
  primary-container: '#C53557'
  on-primary-container: '#FFFFFF'
  
  # Secondary (Glaze / Light Pink)
  secondary: '#FBA8AF'
  on-secondary: '#40242B'
  secondary-container: '#FBA8AF'
  on-secondary-container: '#40242B'
  
  # Neutrals & Accents
  accent-brown: '#6F4137'
  text: '#40242B'
  secondary-text: '#FFFFFF'
  placeholder: '#A9A9A9'
  light-gray: '#D6D6D6'
  white: '#FFFFFF'
  
  # Borders & Outlines
  border: '#40242B'
  border-secondary: '#FBA8AF'
  outline: '#40242B'
  outline-variant: '#D6D6D6'
  
  # Semantic Tags
  tag-product: '#FFA189'
  tag-variety: '#FFF25E'
  tag-attribute: '#8DFBFF'
typography:
  headline-xl:
    fontFamily: PlayfairDisplaySC_600SemiBold
    fontSize: 32
    lineHeight: 40
    letterSpacing: 0.6
  headline-lg:
    fontFamily: PlayfairDisplaySC_600SemiBold
    fontSize: 26
    lineHeight: 34
  headline-md:
    fontFamily: PlayfairDisplaySC_600SemiBold
    fontSize: 20
    lineHeight: 28
  body-lg:
    fontFamily: Inter_400Regular
    fontSize: 18
    lineHeight: 26
  body-md:
    fontFamily: Inter_400Regular
    fontSize: 16
    lineHeight: 24
  body-sm:
    fontFamily: Inter_400Regular
    fontSize: 14
    lineHeight: 20
  label-md:
    fontFamily: Inter_600SemiBold
    fontSize: 12
    lineHeight: 16
    letterSpacing: 0.5
  label-sm:
    fontFamily: Inter_500Medium
    fontSize: 11
    lineHeight: 14
rounded:
  sm: 4
  default: 8
  md: 12
  lg: 16
  xl: 24
  full: 9999
spacing:
  base: 8
  touchable: 48
  margin-mobile: 16
  margin-tablet: 24
  margin-desktop: 40
  gutter-mobile: 12
  gutter-desktop: 24
  container-max: 1200
  stack-xs: 4
  stack-sm: 8
  stack-md: 16
  stack-lg: 24
breakpoints:
  sm: 640
  md: 768
  lg: 1024
  xl: 1280
---

## Brand & Style

The design system is crafted for independent bakers and confectionery owners who balance the precision of production with the warmth of hospitality. The brand personality is **warm, artisanal, and professional**. It avoids the sterility of typical SaaS platforms, opting instead for a "digital kitchen" feel that evokes the tactile nature of flour, parchment, and sugar.

The chosen design style is **Minimalism with a Tactile twist**. It relies on generous whitespace (reminiscent of a clean countertop) and a limited but high-impact color palette. While the UI remains clean and functional, the use of organic background tones and high-contrast editorial typography ensures the interface feels intentional and sophisticated rather than generic.

## Colors

The palette is inspired by confectionery ingredients and warm artisan baking tones:

- **Primary (Dark Pink / Berry Deep - `#C53557`):** Reserved strictly for high-priority actions like "Confirm Order," "Save Recipe," or primary navigation states. Use it sparingly to maintain its significance.
- **Secondary (Light Pink / Glaze Pink - `#FBA8AF`):** Used for navigation pills (`secondaryContainer`), progress bars, soft highlights, and secondary interactive states.
- **Surface & Background (Light Yellow / Parchment - `#F6EDDC`):** Acts as the canvas for the entire application, reducing the harshness of pure white and providing an artisanal, organic warmth.
- **On-Surface / Text (Marsala / Espresso - `#40242B`):** All primary text, standard borders, and key iconography use this deep wine tone to ensure high legibility with softer contrast than pure black.
- **Accent (Warm Brown - `#6F4137`):** Complementary artisanal tone for tertiary badges, depth layers, or subtle emphasis.
- **Containers & Pitch Background (Pure White - `#FFFFFF`):** Used inside cards, text input fields, and elevated panels (`pitchBackground`) for clean contrast against the cream background.
- **Tags & Statuses:**
  - **Product (`#FFA189`):** Soft warm orange for product categories.
  - **Variety (`#FFF25E`):** Soft yellow for recipes, variations, and types.
  - **Attribute (`#8DFBFF`):** Soft cyan for dietary attributes, tags, and technical specs.

## Typography

This design system utilizes a high-contrast typographic pairing to bridge the gap between "artisanal" and "functional".

**Playfair Display SC** is used for headlines. The Small Caps (SC) variant adds a prestigious, stamped quality—much like a baker’s seal. It should be used for page titles and section headers.

**Inter** handles all utilitarian content. It is chosen for its exceptional readability in data-heavy environments like inventory lists and recipe ratios. Use the `label-md` style for category headers to differentiate them from body text through capitalization and letter-spacing.

## Responsive Layout & Grid

The layout is built **Mobile-First** with progressive expansion for tablet and desktop viewports:

- **Mobile (< 768px):** 
  - Single-column flow with a fluid width.
  - Outer screen margins: `16px`.
  - Navigation via Bottom Navigation Bar and Bottom Sheets.
  - Strict adherence to Safe Area insets (top and bottom).
- **Tablet / Desktop (>= 768px):**
  - Multi-column layout (up to 12 columns, max-width `1200px`).
  - Outer screen margins: `24px` to `40px` with `24px` gutters.
  - Navigation transitions to a persistent Sidebar or Top Bar.
  - Modals replace Bottom Sheets; lists adopt split-pane / Master-Detail structures.

## Elevation & Cross-Platform Depth

Avoid heavy, dark drop shadows to maintain a tactile, clean aesthetic.

- **Borders & Tonal Elevation:** Prefer a 1px border (`#40242B` for structured cards or `#D6D6D6` / `#FBA8AF` for subtle dividers) with `#FFFFFF` or `#F6EDDC` container backgrounds.
- **Floating Actions & Modals (Cross-Platform):**
  - **Android:** Use `elevation: 2` to `elevation: 4`.
  - **iOS:** Use `shadowColor: '#40242B'`, `shadowOffset: { width: 0, height: 4 }`, `shadowOpacity: 0.08`, `shadowRadius: 12`.
  - **Web:** Use `box-shadow: 0px 4px 12px rgba(64, 36, 43, 0.08)`.

## Touch & Interaction Targets

- All interactive controls (buttons, icon buttons, checkboxes, chips) must have a minimum hit target of `48x48dp` on touch screens.
- Use visual padding inside the component while ensuring the hit-box complies with accessibility standards.

## Shapes

The shape language is **Rounded**, reflecting the soft, organic nature of dough and baked goods. 

- **Elements:** Standard components (Inputs, Buttons) use a `8px` (`rounded.default`) radius.
- **Large Containers:** Cards and Modals use a `16px` (`rounded.lg`) radius to feel approachable and modern.
- **Icons:** Icons should utilize a rounded stroke-cap to match the UI's softness.

## Components

- **Buttons:** Primary buttons use a solid Primary background (`#C53557`) with White text (`#FFFFFF`). Secondary buttons use a Secondary background (`#FBA8AF`) with Marsala text (`#40242B`). Text is centered and uses `label-md` weight.
- **Chips & Tags:** Used for order statuses and item tags (Product `#FFA189`, Variety `#FFF25E`, Attribute `#8DFBFF`). These should have a full pill border-radius (`9999px`) with dark Marsala text (`#40242B`).
- **Input Fields:** Pure white background (`#FFFFFF`) with a 1px Marsala border (`#40242B`) or light outline (`#D6D6D6`). Placeholder text uses `#A9A9A9` and labels use `#40242B` in `label-sm`.
- **Cards:** Pure white (`#FFFFFF`) or cream (`#F6EDDC`) containers with a subtle 1px border (`#40242B` / `#D6D6D6`). Group recipe details or inventory metrics without heavy drop shadows.
- **Lists:** Ingredient and inventory lists should use `body-md` for items and `body-sm` for quantities, with `#D6D6D6` or `#FBA8AF` horizontal dividers between rows.
- **Checkboxes & Radios:** Should feel tactile and use Primary (`#C53557`) for the active/checked state.