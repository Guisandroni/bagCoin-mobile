---
name: Modern Financial System
colors:
  surface: '#fbf9fb'
  surface-dim: '#dbd9dc'
  surface-bright: '#fbf9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f6'
  surface-container: '#efedf0'
  surface-container-high: '#e9e7ea'
  surface-container-highest: '#e3e2e5'
  on-surface: '#1b1c1e'
  on-surface-variant: '#434656'
  inverse-surface: '#303033'
  inverse-on-surface: '#f2f0f3'
  outline: '#747687'
  outline-variant: '#c3c5d8'
  surface-tint: '#064ceb'
  primary: '#003cc1'
  on-primary: '#ffffff'
  primary-container: '#1652f0'
  on-primary-container: '#dadfff'
  inverse-primary: '#b7c4ff'
  secondary: '#006c4d'
  on-secondary: '#ffffff'
  secondary-container: '#64fcc2'
  on-secondary-container: '#007352'
  tertiary: '#9b0010'
  on-tertiary: '#ffffff'
  tertiary-container: '#c60f1c'
  on-tertiary-container: '#ffd7d2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#64fcc2'
  secondary-fixed-dim: '#40dfa8'
  on-secondary-fixed: '#002115'
  on-secondary-fixed-variant: '#005139'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb3ac'
  on-tertiary-fixed: '#410003'
  on-tertiary-fixed-variant: '#93000f'
  background: '#fbf9fb'
  on-background: '#1b1c1e'
  surface-variant: '#e3e2e5'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-lg:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  container-margin: 20px
  stack-gap-lg: 24px
  stack-gap-md: 16px
  stack-gap-sm: 8px
  inline-padding-lg: 32px
  inline-padding-md: 16px
---

## Brand & Style

This design system is engineered for the next generation of digital finance, prioritizing clarity, speed, and high-trust interactions. It draws inspiration from **Modern Corporate** aesthetics but injects a **High-Contrast Bold** personality to ensure interactive elements are unmistakable. 

The visual narrative focuses on "Optimistic Utility"—where the interface feels like a sophisticated tool that is also inviting and accessible. By combining massive, pill-shaped containers with a high-saturation blue, the system evokes a sense of technological advancement and financial security. The audience is the modern investor: someone who values efficiency, clean data visualization, and a "mobile-first" ergonomic experience.

## Colors

The palette is anchored by a high-saturation **Vibrant Blue (#1652F0)**, used specifically for primary actions, navigation indicators, and branding moments. To create depth and reduce eye strain, the background uses a subtle **Light Gray/Blue tint (#F4F7F9)** rather than pure white. 

Functional colors include a vibrant green for positive growth and a sharp red for declines or alerts, both calibrated to match the intensity of the primary blue. Neutrals are tiered from a deep charcoal for text to soft grays for secondary borders and background layering.

## Typography

This design system utilizes **Manrope** for its entire type scale. Manrope was selected for its modern, geometric construction and its exceptional readability in financial contexts, particularly for numerical data. 

The hierarchy is strictly defined:
- **Display styles** are used for account balances and major portfolio headings.
- **Label styles** use increased letter spacing and uppercase transforms to differentiate metadata from body content.
- **Numeric values** should always use tabular lining to ensure vertical alignment in lists and charts.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model optimized for mobile viewport widths. A standard 20px margin is applied to the left and right edges of the screen to provide "breathing room" for the high-contrast elements.

The spacing rhythm is built on an **8pt grid**. Large vertical gaps (24px) separate major content blocks like charts and list groups, while tighter gaps (8px-12px) are used within components to maintain visual grouping. Interactive elements like buttons and input fields utilize prominent internal padding (16px-20px vertically) to ensure a large, accessible tap target.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** rather than heavy drop shadows. The base background is the light blue tint, while interactive containers (cards, buttons) use solid white or primary blue fills to "pop" forward.

Where depth is required for overlays or floating action buttons, use **Ambient Shadows**. These should be extra-diffused with a low opacity (8-12%) and a slight blue tint to match the brand palette. High-contrast outlines are used for secondary components (like "Transfer" buttons) to maintain visibility without competing with the primary solid-fill actions.

## Shapes

The defining characteristic of this design system is its **extra-rounded geometry**. All primary containers, such as cards and bottom sheets, utilize a 24px-32px corner radius.

Buttons and chips follow a **Pill-shaped (3)** logic, ensuring the ends are perfectly semicircular. This softness balances the bold typography and high-saturation colors, making the financial interface feel approachable and friendly rather than rigid and institutional.

## Components

### Buttons
Primary buttons are solid #1652F0 with white text, featuring a minimum height of 56px and a pill-shaped radius. Secondary buttons use a light blue ghost-fill or a subtle 1px border with #1652F0 text.

### Cards
Financial data cards are solid white with a 24px corner radius. They should not use borders; instead, they rely on the background tint for separation. Inner padding is generous, typically 20px.

### Input Fields
Search bars and text inputs are pill-shaped with a background color that is slightly darker than the page background (e.g., #ECEFF3). On focus, they transition to a 2px primary blue border.

### Chips & Tags
Used for time-period selectors (1H, 1D, 1W) or categories. Active states should use a subtle blue tint with bold primary blue text, while inactive states remain neutral.

### Lists
Transaction and asset lists should use a "clean-line" approach. Each row has a height of 72px, with icons housed in 48px rounded-square or circular containers to maintain the soft visual language.