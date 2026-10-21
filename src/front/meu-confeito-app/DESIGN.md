---
name: Meu Confeito
colors:
  # Base & Surfaces (Blush-Cream Tonal Hierarchy & Parchment)
  background: '#FFF8F7'
  surface: '#FFF8F7'
  surface-dim: '#EDD4D6'
  surface-bright: '#FFF8F7'
  surface-container-lowest: '#FFFFFF'
  surface-container-low: '#FFF0F1'
  surface-container: '#FFE9EA'
  surface-container-high: '#FBE2E4'
  surface-container-highest: '#F5DDDE'
  surface-variant: '#F5DDDE'
  parchment: '#F6EDDC'

  # Text & On-Surface Colors
  on-surface: '#25181A'
  on-surface-variant: '#584143'
  espresso-dark: '#40242B'
  text: '#40242B'
  inverse-surface: '#3C2D2E'
  inverse-on-surface: '#FFECED'

  # Primary (Berry / Deep Crimson)
  primary: '#A31940'
  on-primary: '#FFFFFF'
  primary-container: '#C53557'
  on-primary-container: '#FFEAEC'
  primary-fixed: '#FFD9DD'
  on-primary-fixed: '#400012'

  # Secondary (Glaze Pink & Rose)
  secondary: '#8D4B52'
  on-secondary: '#FFFFFF'
  secondary-container: '#FBA8AF'
  on-secondary-container: '#40242B'
  secondary-fixed: '#FFDADB'
  on-secondary-fixed: '#7A3C43'

  # Tertiary & Semantic (Artisanal Green / Financial Growth & Profit)
  tertiary: '#006139'
  on-tertiary: '#FFFFFF'
  tertiary-container: '#007D4A'
  on-tertiary-container: '#BBFFD0'
  tertiary-fixed: '#93F7B8'
  on-tertiary-fixed: '#002110'

  # Neutrals & Artisanal Accents
  accent-brown: '#6F4137'
  placeholder: '#8C7073'
  light-gray: '#E0BEC1'
  white: '#FFFFFF'

  # Borders & Outlines
  border: '#E0BEC1'
  border-subtle: '#F6EDDC'
  border-emphasis: '#40242B'
  outline: '#8C7073'
  outline-variant: '#E0BEC1'

  # Status & Feedback
  error: '#BA1A1A'
  on-error: '#FFFFFF'
  error-container: '#FFDAD6'
  on-error-container: '#93000A'

typography:
  headline-xl:
    fontFamily: PlayfairDisplaySC_600SemiBold
    fontSize: 32
    lineHeight: 38
    letterSpacing: 0.6
  headline-lg:
    fontFamily: PlayfairDisplaySC_600SemiBold
    fontSize: 26
    lineHeight: 32
  headline-md:
    fontFamily: PlayfairDisplaySC_600SemiBold
    fontSize: 20
    lineHeight: 26
  body-lg:
    fontFamily: Inter_400Regular
    fontSize: 18
    lineHeight: 28
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
    letterSpacing: 0.2

rounded:
  sm: 4
  default: 8
  md: 12
  lg: 16
  xl: 24
  full: 9999

shadows:
  soft: '0px 4px 20px rgba(37, 24, 26, 0.05)'
  hover: '0px 8px 30px rgba(37, 24, 26, 0.08)'
  modal: '0px 12px 40px rgba(37, 24, 26, 0.12)'
  glow: '0px 4px 12px rgba(163, 25, 64, 0.25)'

spacing:
  base: 8
  touchable: 48
  margin-mobile: 16
  margin-tablet: 24
  margin-desktop: 40
  gutter-mobile: 16
  gutter-desktop: 24
  container-max: 1200
  space-1: 4
  space-2: 8
  space-3: 12
  space-4: 16
  space-5: 20
  space-6: 24
  space-8: 32
  space-10: 40
  space-12: 48
  space-16: 64

breakpoints:
  sm: 640
  md: 768
  lg: 1024
  xl: 1280
---

## Brand & Style

The design system is crafted for independent bakers and confectionery owners who balance the precision of production with the warmth of hospitality. The brand personality is **warm, artisanal, and professional**. It avoids the sterile look of generic SaaS platforms, opting instead for a "digital kitchen" feel that evokes the tactile nature of flour, parchment, and sugar.

The chosen design style is **Minimalism with Tactile Confectionery Elegance**. It pairs generous whitespace with a tiered blush-cream canvas, delicate rose-taupe borders, and organic confectionery glazes. High-contrast serif headlines deliver an editorial, stamped feel, while clean utilitarian sans-serif typography ensures effortless readability for complex recipe scaling and cost calculations.

## Colors

The palette is inspired by confectionery ingredients, warm baking ovens, and financial clarity:

- **Primary (Interactive Berry `#A31940` & Berry Deep `#C53557`):** Used for primary calls-to-action ("Simulate Recipe", "Confirm Order"), active tab highlights, and brand emphasis. `#C53557` acts as the solid primary container and hover anchor.
- **Secondary (Glaze Pink `#FBA8AF` & Rose Fixed `#FEABB2` / `#FFDADB`):** Represents smooth glazes and soft confectionery coatings. Used for secondary interactive states, secondary buttons, progress bars, and delicate accent backgrounds.
- **Surface & Background (Blush-Cream `#FFF8F7` & Parchment `#F6EDDC`):** The primary canvas uses a soft blush-cream tone (`#FFF8F7`), while `#F6EDDC` provides warm artisan parchment character for secondary backgrounds, subtle dividers, and warm tactile cards.
- **On-Surface & Text (Espresso Dark `#40242B` & Cocoa `#25181A`):** Headlines, brand titles, and high-emphasis labels use `#40242B` (Espresso Dark). General body text uses `#25181A` with `#584143` for muted secondary descriptors, ensuring optimal legibility without the harshness of pure black.
- **Accent (Warm Brown `#6F4137`):** Artisanal cocoa tone reserved for tertiary badges, secondary indicators, and depth accents.
- **Tertiary & Semantic Success (Artisanal Green `#006139` / `#93F7B8`):** Crucial for highlighting recipe profit margins, suggested retail markup, yield gains, and validated differentiators.
- **Borders & Outlines (`#E0BEC1` / `#8C7073`):** Delicate rose-taupe borders (`#E0BEC1`) replace harsh black strokes on cards, tables, and inputs, keeping layouts light and cohesive. `#40242B` is reserved for intentional high-contrast emphasis.

### Semantic Badges & Chips:

- **Primary Chip (`#FFD9DD` / `#400012`):** Core features, essential badges, and project highlights.
- **Secondary Chip (`#FFDADB` / `#7A3C43`):** Virality markers, geolocation tags, and recipes.
- **Success Chip (`#93F7B8` / `#002110`):** Profit calculations, positive metrics, and active ready-to-deliver statuses.
- **Accent Chip (`#FBE2E4` / `#C53557`):** Batch yield, production management, and operational tags.

## Typography

This design system utilizes a high-contrast typographic pairing bridging the gap between "artisanal warmth" and "operational precision":

**Playfair Display SC** is used for brand headlines and major section titles. The Small Caps (SC) variant adds a prestigious, stamped quality—reminiscent of a classic baker’s seal.

- `headline-xl`: 32px (fluid clamp up to 40px on large viewports), weight 600, letter spacing `0.6` (0.02em).
- `headline-lg`: 26px (fluid clamp up to 32px), weight 600, line height 32px.
- `headline-md`: 20px (fluid clamp up to 24px), weight 600, line height 26px.

**Inter** handles all utilitarian content, forms, recipe grids, and data-dense tables:

- `body-lg`: 18px / 28px line height.
- `body-md`: 16px / 24px line height.
- `body-sm`: 14px / 20px line height (supporting labels, ingredient quantities, and helper copy).
- `label-md`: 12px / 16px, weight 600, uppercase with letter spacing `0.5` (0.04em–0.05em) for category badges, table headers, and button text.
- `label-sm`: 11px / 14px, weight 500.

> **Tech Note (Expo Fonts):** Fonts must be loaded using the Expo Google Fonts packages (`@expo-google-fonts/playfair-display-sc` and `@expo-google-fonts/inter`). Use the `useFonts` hook at the root of the application (e.g., in `_layout.tsx` or `App.tsx`) to ensure both families are loaded before rendering text.

## Responsive Layout & Grid

The layout is built **Mobile-First** with progressive enhancements for tablet and desktop viewports:

- **Mobile (< 768px):**
  - Single-column flow with fluid width.
  - Screen margins: `16px` (down to `12px` on ultra-compact screens <= 360px).
  - Column gutters: `16px` (down to `12px` on <= 480px).
  - Navigation via fixed Bottom Navigation Bar or collapsible top drawer.
  - Strict adherence to Safe Area insets (top and bottom).
- **Tablet / Desktop (>= 768px):**
  - Multi-column 12-column grid system (max-width `1200px`).
  - Screen margins: `24px` to `40px` with `24px` gutters.
  - Navigation expands to a sticky desktop header with blurred translucent backdrop (`backdrop-filter: blur(12px)`).
  - Multi-column split views (e.g., interactive calculator with side-by-side ingredient list and live financial summary).

## Elevation & Depth (Soft Tactile Elevation)

Rather than harsh drops or completely flat surfaces, the interface utilizes **Soft Tactile Elevation** with warm, diffused shadows tinted by the espresso palette:

- **Default Cards & Panels:**
  - Base: Pure white (`#FFFFFF`) or tinted surface (`#FFF0F1` / `#FFE9EA`).
  - Stroke: `1px solid #E0BEC1` (`outline-variant`).
  - Shadow: Optional subtle ambient diffusion (`0px 4px 20px rgba(37, 24, 26, 0.05)`).
- **Hover / Interactive Cards:**
  - Stroke transitions to `#A31940` (Primary).
  - Shadow expands to `0px 8px 30px rgba(37, 24, 26, 0.08)` with a smooth `250ms` ease.
- **Buttons (Hover State):**
  - Primary button lifts with a soft berry glow: `box-shadow: 0 4px 12px rgba(163, 25, 64, 0.25)`.
- **Modals & Dialogs:**
  - Backdrop: `rgba(37, 24, 26, 0.6)` with `backdrop-filter: blur(4px)`.
  - Dialog container: `0px 12px 40px rgba(37, 24, 26, 0.12)`.
- **Floating Action Triggers (FAB) & Map Pins:**
  - Android: `elevation: 4`
  - iOS / Web: `box-shadow: 0 4px 10px rgba(163, 25, 64, 0.35)`.

## Touch & Interaction Targets

- All interactive controls (buttons, icon buttons, checkboxes, chips, table row actions) must have a minimum touch hit target of `48x48dp`.
- Ensure comfortable internal padding (`12px 24px` for standard buttons; `8px 16px` for small triggers) while keeping hit-boxes accessible.

## Shapes & Iconography

The shape system balances organic confection curves with crisp digital alignment:

- **Inputs, Buttons, and Icon Boxes:** `8px` (`rounded.default`).
- **Inner Metric Cells, Table Cards, and Dialog Boxes:** `12px` (`rounded.md`).
- **Standard Cards, Comparison Columns, and Panels:** `16px` (`rounded.lg`).
- **Showcase Wrappers (Hero Card, Calculator Panel, Map Showcase, CTA):** `24px` (`rounded.xl`).
- **Pills, Chips, Avatars, and Map Pins:** Full pill `9999px` (`rounded.full`).
- **Icons:** Use `MaterialSymbol` from Material Symbols (`MaterialSymbolsOutlined`). Use clean strokes to match the editorial typography.

## Components

- **Buttons:**
  - _Primary:_ Solid background `#A31940`, text `#FFFFFF`, uppercase `label-md`, `8px` radius. Hover shifts to `#C53557` with a soft berry glow.
  - _Secondary:_ Background `#FBA8AF` / `#FEABB2`, text `#40242B` or `#7A3C43`. Hover transitions to `#FBA8AF`.
  - _Outline:_ Transparent background, border `1px solid #E0BEC1`, text `#40242B`. Hover fills with `#FFE9EA`.
- **Chips & Tags:** Pill-shaped (`9999px`), padding `4px 12px`, with optional `6px` circular status indicator (`chip-dot`). Follow the 4-tier semantic color definition.
- **Input Fields & Selects:** Pure white background (`#FFFFFF`), `1px solid #E0BEC1`, text `#25181A`. On focus: outline border `#A31940` with an outer ring `0 0 0 2px #FBA8AF`.
- **Cards & Containers:** Pure white (`#FFFFFF`) or soft tinted cream (`#FFF0F1` / `#FFE9EA`) with a `1px solid #E0BEC1` border and `16px` radius. Hover states smoothly tint the border toward `#A31940`.
- **Tables & Financial Demonstratives:** Clean horizontal rows separated by `1px solid #FBE2E4` or `#E0BEC1`. Headers are uppercase, muted, and spaced (`label-md`). Key cost lines and selling prices receive prominent sizing in `#A31940` or `#006139`.
- **Call-to-Action Banners:** Deep espresso gradient (`#40242B` to `#2F171D`) with subtle radial berry overlays (`rgba(197, 53, 87, 0.4)`), white typography, and `24px` rounded corners.
