# Design System Document: The Illuminated Sanctuary

## 1. Overview & Creative North Star
This design system is built upon the "Illuminated Sanctuary" concept—a digital expression of warmth, safety, and community. Unlike standard utility apps that feel cold or clinical, this system utilizes a "High-End Editorial" approach. We move away from the rigid, boxed-in layouts of traditional mobile design and toward an experience that feels like a boutique lifestyle publication.

**Creative North Star: The Breathable Canvas**
The goal is to provide a sense of "spiritual exhale." We achieve this through:
*   **Intentional Asymmetry:** Off-setting headers and using generous, unbalanced white space to create a human, non-mechanical rhythm.
*   **Layered Translucency:** Using the warm color palette to create depth through light, not shadow.
*   **Soft Modernism:** Utilizing massive corner radii (up to 48px in specific hero areas) to evoke the organic curves of communal spaces.

---

## 2. Colors & Surface Logic
The palette is a sophisticated blend of sun-drenched ambers and bone-whites. It is designed to feel "lit from within."

### The Palette
*   **Primary Brand Amber:** `oklch(82.8% 0.189 84.429)` / `#F59E0B` (The glow of community)
*   **Primary Hover:** `oklch(76.9% 0.188 70.08)` / `#D97706` (The depth of engagement)
*   **Page Background:** `oklch(98.6% 0.002 67.8)` / `#FDFCF8` (The canvas)
*   **Surface/Secondary:** `oklch(96% 0.002 17.2)` / `#F5F4F1` (Subtle structural shifts)

### The "No-Line" Rule
To maintain a premium, editorial feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined solely through:
1.  **Background Color Shifts:** Placing a `surface_container_low` section directly against the `#FDFCF8` background.
2.  **Tonal Transitions:** Using the `Primary Soft` (`#FFF7E6`) to highlight active zones.

### Glass & Gradient Strategy
To move beyond a "standard" UI, use the **Amber Aura Gradient** for primary actions: a linear transition from `primary` to `primary_hover` at a 135-degree angle. For floating navigation or modals, utilize **Glassmorphism**: 
*   **Fill:** `surface_container_lowest` (#FFFFFF) at 85% opacity.
*   **Backdrop Blur:** 16px to 24px.
*   **Effect:** This allows the warm background colors to bleed through, ensuring the UI feels integrated into the environment rather than "pasted" on top.

---

## 3. Typography: The Rubik Scale
We use **Rubik** exclusively. Its slightly rounded terminals echo our large corner radii, creating a cohesive visual language.

*   **Display (Editorial Moments):** Use `display-lg` (3.5rem) with -0.02em letter spacing. Use this for welcoming messages or daily verses. It should feel like a headline in a high-end magazine.
*   **Headlines (Navigation):** `headline-md` (1.75rem). Bold and authoritative but softened by the font's geometry.
*   **Body (Community Stories):** `body-lg` (1rem). Increase line-height to 1.6 for maximum readability and "breathing room."
*   **Labels (Utility):** `label-md` (0.75rem). Use All-Caps with +0.05em tracking only for small, tertiary metadata to provide a sophisticated contrast.

---

## 4. Elevation & Depth
In this design system, elevation is a matter of **Tonal Layering**, not structural darkness.

*   **The Layering Principle:** Depth is achieved by stacking. Place a `#FFFFFF` (Surface Lowest) card on a `#F5F4F1` (Surface Secondary) section. The contrast provides all the "lift" needed.
*   **Ambient Shadows:** If a floating element (like a FAB) requires a shadow, it must be an "Organic Amber Shadow":
    *   **Color:** `oklch(82.8% 0.189 84.429)` at 8% opacity.
    *   **Blur:** 32px.
    *   **Spread:** -4px. 
    *   This mimics natural light passing through amber glass rather than a harsh grey shadow.
*   **The "Ghost Border":** For input fields where definition is legally or functionally required, use `outline_variant` at 20% opacity. Never use 100% opaque outlines.

---

## 5. Components

### Primary Buttons
*   **Style:** Fully pill-shaped (`rounded-full`).
*   **Color:** The Amber Aura Gradient.
*   **Typography:** `title-sm` in `#FFFFFF`, centered.
*   **Interaction:** On hover/press, scale slightly (98%) to provide tactile feedback without needing "heavy" shadows.

### Cards & Lists
*   **Rule:** Forbid the use of divider lines.
*   **Style:** Cards use `rounded-lg` (2rem) or `rounded-md` (1.5rem). 
*   **Separation:** Use vertical white space from the spacing scale (e.g., 24px or 32px) to separate list items. A soft `Primary Soft` (#FFF7E6) background can be used to highlight "Featured Events" or "New Messages."

### Input Fields
*   **Style:** Eschew the traditional "box." Use a soft-filled `surface_container_low` with a `rounded-sm` (0.5rem) corner.
*   **Focus State:** The background shifts to `surface_container_lowest` (#FFFFFF) with a 1px `Primary Brand Amber` "Ghost Border" at 40% opacity.

### Navigation (The Floating Dock)
Instead of a pinned bottom bar, use a floating navigation "dock" with `rounded-full` corners and a 12px margin from the screen bottom. Apply the Glassmorphism blur effect here to maintain the "Illuminated Sanctuary" feel.

---

## 6. Do's and Don'ts

### Do:
*   **Embrace Whitespace:** If a screen feels "busy," increase the padding. This system relies on room to breathe.
*   **Use Soft Transitions:** All state changes (hover, active, focus) should use a 300ms ease-in-out transition.
*   **Prioritize Hierarchy:** Use the `Primary Brand Amber` sparingly—only for the most important actions (Giving, Joining, Confirming).

### Don't:
*   **Don't use Dark Mode:** This system is strictly light-only to maintain its specific warm, morning-light aesthetic.
*   **Don't use 90-degree Corners:** Everything must have at least an 8px radius. Sharp corners break the "Welcoming" promise.
*   **Don't use Pure Black:** Always use `Text Primary` (#111827) or `Text Secondary` (#4B5563). Pure black (#000000) is too harsh for this sanctuary.
*   **Don't use Dividers:** If you feel the need to add a line, try adding 16px of white space instead.