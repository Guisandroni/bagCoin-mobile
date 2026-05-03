```markdown
# Design System Specification

## 1. Overview & Creative North Star: "The Kinetic Monolith"
This design system is built on the tension between massive, authoritative weight and airy, ethereal lightness. Our Creative North Star is **The Kinetic Monolith**. We reject the "generic SaaS" look in favor of a high-end editorial experience that feels curated rather than templated.

To achieve this, we move away from traditional grid-bound constraints. We utilize intentional asymmetry, extreme typographic scales, and a "tonal-first" approach to depth. By leaning into the brutalist weight of 'Space Grotesk' and offsetting it with a sophisticated, light-drenched palette, we create a digital environment that feels premium, urgent, and undeniably modern.

---

## 2. Colors
Our palette is anchored by a luminous, off-white foundation (`surface`) and energized by a high-vis primary accent. 

### Core Tones
- **Foundation**: `background` (`#fbffe1`) provides a warmer, more premium feel than clinical white.
- **The Power Accent**: `primary_container` (`#a9fb73`) is our signature vibrant green. Use this for high-impact moments and primary actions.
- **The Ink**: `on_background` (`#323c0f`) acts as our "black." It is a deep, over-saturated forest-black that feels more organic than pure `#000000`.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts. Use `surface_container_low` to carve out sections from the main `surface`. If you feel the need for a line, use white space instead.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. To create depth without shadows:
1.  **Base Layer**: `surface`
2.  **Inset Content**: `surface_container_low`
3.  **Raised Interactive Elements**: `surface_container_lowest` (Pure white)

### The "Glass & Gradient" Rule
To elevate beyond flat design, use Glassmorphism for floating navigation or overlay cards. Apply the `surface` color at 70% opacity with a `24px` backdrop blur. For main CTAs, apply a subtle linear gradient from `primary` to `primary_fixed_dim` to provide a "tactile soul" to the vibrant green.

---

## 3. Typography
Typography is the primary visual driver of this system. It is not just for reading; it is a graphical element.

- **Display & Headlines (Space Grotesk)**: These should be set with tight tracking (-2% to -4%) and heavy weights. 'Display-lg' (`3.5rem`) should feel monolithic and dominate the viewport.
- **Body & Labels (Inter)**: Use 'Inter' for all functional and long-form text. It provides a neutral, highly readable counterpoint to the aggressive personality of Space Grotesk.
- **Intentional Contrast**: Always pair a `display-lg` headline with `body-md` or `label-md` nearby. This extreme jump in scale is what creates the "Editorial" signature.

---

## 4. Elevation & Depth
We eschew traditional Material Design shadows in favor of **Tonal Layering**.

- **The Layering Principle**: Depth is achieved by "stacking." Place a `surface_container_lowest` card on a `surface_container_low` section. This creates a soft, natural lift.
- **Ambient Shadows**: When an element must float (e.g., a modal), use an ultra-diffused shadow: `0px 24px 48px rgba(50, 60, 15, 0.06)`. Note the color: we use a tint of `on_surface` (the dark green-black), never pure grey.
- **The "Ghost Border" Fallback**: If a border is required for accessibility, use `outline_variant` at 15% opacity. Full-opacity borders are strictly forbidden as they clutter the minimalist aesthetic.
- **Backdrop Blurs**: Use blurs on `surface_bright` containers to allow the vibrant primary accents to bleed through from the background, softening the overall composition.

---

## 5. Components

### Buttons
- **Primary**: Pill-shaped (`rounded-full`), background: `primary_container`, text: `on_primary_container`. No border.
- **Secondary**: Pill-shaped, `outline` variant (Ghost Border style), text: `on_surface`.
- **Tertiary**: Text-only using `title-sm` with a `primary` color underline on hover.

### Cards
Cards must never have borders. Use `surface_container_highest` for a subtle "pop" against the `surface` background. Apply `xl` (3rem) or `lg` (2rem) corner radius to maintain a friendly, modern silhouette.

### Input Fields
Text inputs should use `surface_container_low` as a background. The label should use `label-md` in `on_surface_variant`. On focus, the background shifts to `surface_container_lowest` with a 2px `primary` bottom-border only—no full box focus.

### Chips
Use `secondary_container` with `on_secondary_container` text. These should be strictly pill-shaped (`rounded-full`) to contrast against the sharp, heavy typography.

### Additional Signature Component: The "Hero Pull-Quote"
A specialized component for landing pages: `display-md` typography in `on_background`, center-aligned, with a `primary_container` highlight behind key words.

---

## 6. Do's and Don'ts

### Do:
- **Do** use massive amounts of white space (negative space). If a section feels crowded, double the padding.
- **Do** use the `primary_container` (`#a9fb73`) sparingly. It is a spotlight, not a floodlight.
- **Do** align large typography to a strict baseline, but allow images and decorative elements to break the grid for an "offset" editorial look.

### Don't:
- **Don't** use 1px dividers to separate list items. Use 16px of vertical space or a subtle `surface` shift.
- **Don't** use standard "drop shadows." If it doesn't look like ambient light, it's too heavy.
- **Don't** mix 'Space Grotesk' and 'Inter' within the same sentence. Keep the roles of "Voice" (Display) and "Data" (Body) distinct.
- **Don't** use pure black `#000000`. It kills the premium "paper" feel of the `surface` tokens. Use `on_background`.

---
*Director's Note: Remember, minimalism is not the absence of design; it is the result of extreme intentionality. Every pixel of white space must feel like a choice.*```