---
name: High-Performance Redis Monitoring System
colors:
  surface: '#1f0f0d'
  surface-dim: '#1f0f0d'
  surface-bright: '#493432'
  surface-container-lowest: '#190a08'
  surface-container-low: '#281715'
  surface-container: '#2d1b19'
  surface-container-high: '#382523'
  surface-container-highest: '#44302e'
  on-surface: '#fbdbd7'
  on-surface-variant: '#e6bdb8'
  inverse-surface: '#fbdbd7'
  inverse-on-surface: '#3f2c29'
  outline: '#ac8884'
  outline-variant: '#5c403c'
  surface-tint: '#ffb4ab'
  primary: '#ffb4ab'
  on-primary: '#690005'
  primary-container: '#dc2626'
  on-primary-container: '#fff6f5'
  inverse-primary: '#bf0715'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#90cdff'
  on-tertiary: '#003450'
  tertiary-container: '#0078b2'
  on-tertiary-container: '#f3f8ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000b'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#cbe6ff'
  tertiary-fixed-dim: '#90cdff'
  on-tertiary-fixed: '#001e30'
  on-tertiary-fixed-variant: '#004b71'
  background: '#1f0f0d'
  on-background: '#fbdbd7'
  surface-variant: '#44302e'
typography:
  h1:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  mono-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-sidebar: 240px
---

## Brand & Style

This design system is engineered for developers and database administrators who require real-time precision and high information density. The aesthetic is "Technical Minimalism"—a style that prioritizes data legibility and system status over decorative elements. By utilizing a deep, obsidian-inspired palette, the interface minimizes eye strain during late-night debugging sessions while allowing vibrant status accents to command immediate attention.

The UI should evoke a sense of "observability." It avoids unnecessary skeuomorphism, opting instead for a streamlined, layered approach where depth is communicated through subtle tonal shifts and crisp, low-opacity borders. The overall experience must feel fast, responsive, and authoritative, mirroring the low-latency nature of Redis itself.

## Colors

The color palette is anchored by a deep navy and charcoal foundation to provide maximum contrast for data visualization. **Background Base (#0F172A)** serves as the primary canvas, while **Background Surface (#1E293B)** defines cards, panels, and navigation elements.

The accent strategy follows a strict semantic hierarchy:
- **Redis Red (#DC2626)** is used sparingly for primary actions, branding, and critical error states.
- **Success Green (#10B981)**, **Warning Orange (#F59E0B)**, and **Info Blue (#3B82F6)** are dedicated to system health indicators, sparklines, and real-time telemetry.
- **Text Primary (#F8FAFC)** ensures crisp readability, while **Text Secondary (#94A3B8)** is used for metadata and labels to maintain visual hierarchy.

## Typography

This design system utilizes a dual-font strategy to distinguish between UI orchestration and technical data. 

**Inter** is the primary sans-serif used for all interface labels, buttons, and navigation. It is chosen for its exceptional legibility in dark environments and its neutral, professional character.

**JetBrains Mono** is the dedicated font for all technical values, memory addresses, CLI outputs, and performance metrics. The monospaced nature ensures that fluctuating numbers in real-time charts and grids do not cause "jitter" or layout shifts, allowing developers to scan columns of data with mathematical precision.

## Layout & Spacing

The layout follows a **fluid grid** model optimized for wide-screen desktop monitoring. The primary structure consists of a fixed-width left navigation sidebar (240px) and a flexible main content area that expands to fill the viewport.

A rigorous 8px (base 4px) spacing rhythm is enforced to maintain high information density without sacrificing clarity. For complex dashboard views, a 12-column grid is used for the main canvas, allowing for modular "widgets" that can span 3, 4, 6, or 12 columns. Gutters are fixed at 16px to ensure distinct separation between data-heavy panels.

## Elevation & Depth

In this design system, depth is achieved through **tonal layering** and **low-contrast outlines** rather than traditional shadows. This approach maintains a "flat" professional aesthetic suitable for technical tools.

1.  **Level 0 (Base):** #0F172A - The main application background.
2.  **Level 1 (Surface):** #1E293B - Used for cards, sidebars, and header bars.
3.  **Level 2 (Overlay):** #334155 - Used for dropdown menus, tooltips, and modal dialogs.

To define boundaries, a subtle 1px border (#334155) is applied to all Level 1 and Level 2 surfaces. This "ghost border" provides structure without the visual clutter of heavy drop shadows, ensuring the UI feels like a single, integrated instrument.

## Shapes

The shape language is "Soft" (Level 1) to balance technical precision with modern UI sensibilities. 

- **Standard Elements:** Buttons, inputs, and small cards use a 4px (0.25rem) corner radius.
- **Large Containers:** Dashboard widgets and main panels use an 8px (0.5rem) radius.
- **Status Indicators:** Indicators for "connected" or "active" states utilize full pill-shaped rounding to distinguish them from interactive buttons.

This subtle rounding prevents the interface from feeling overly aggressive or "brutalist" while maintaining the sharp edges expected in a developer tool.

## Components

### Data Grids
Grids are the core of the system. They feature a "Compact" mode with 8px vertical padding. Headers are sticky, using JetBrains Mono in All-Caps for clarity. Row hovering highlights the entire line in a subtle #2D3748 tint.

### Real-time Charts
Charts use thin 1.5pt lines for metrics. Area charts use a 10% opacity fill of the stroke color. Grids within charts are minimal, using dashed lines in #334155. Crosshairs must be visible on hover to provide exact monospaced data points.

### Status Indicators
Small, 8px circular dots. For "Active" states, a subtle pulse animation (2s duration) is applied to a secondary outer ring of the same color.

### Side Navigation
A vertical rail with icons and labels. The active state is indicated by a 2px Redis Red vertical bar on the left edge and a subtle text color shift to white.

### Buttons
- **Primary:** Redis Red background, white text.
- **Secondary:** Transparent background with a 1px #334155 border.
- **Ghost:** No background or border, used for utility actions in toolbars.

### Input Fields
Dark-filled inputs (#0F172A) with a 1px border. On focus, the border transitions to Info Blue (#3B82F6) with a 2px outer glow of the same color at 20% opacity.