# Design System Documentation: The Fiscal Architect

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Fiscal Architect."** In a world of cluttered financial tools, this system acts as a precision instrument—stable, transparent, and authoritative. It moves away from the "app-template" look by embracing **High-End Editorial** layouts. 

Instead of rigid, boxed-in grids, we utilize intentional asymmetry, vast "breathing room" (negative space), and high-contrast typography scales. The goal is to make the user feel they are interacting with a premium concierge service rather than a database. The interface should feel like a series of layered, physical materials—fine paper and frosted glass—stacked with architectural intent.

## 2. Colors & Tonal Depth
This system uses a palette of deep midnight blues and sophisticated cool greys to establish a sense of unwavering trust.

*   **The "No-Line" Rule:** To achieve a high-end feel, **1px solid borders are prohibited for sectioning.** Boundaries must be defined solely through background color shifts. Use `surface-container-low` for large section backgrounds sitting on a `surface` base. This creates a natural, soft transition that looks "designed" rather than "constructed."
*   **Surface Hierarchy & Nesting:** Depth is achieved by nesting surface tokens. 
    *   Base Layer: `surface` (#f7f9fb)
    *   Secondary Sectioning: `surface-container-low` (#f2f4f6)
    *   Interactive Cards: `surface-container-lowest` (#ffffff)
*   **The "Glass & Gradient" Rule:** For mobile navigation bars or floating action modals, use Glassmorphism. Apply `surface` at 80% opacity with a `20px` backdrop-blur. 
*   **Signature Textures:** For primary call-to-actions (CTAs), use a subtle linear gradient from `primary` (#041221) to `primary-container` (#1a2736) at a 135-degree angle. This adds a "lithographic" soul to the UI that flat colors lack.

## 3. Typography: The Editorial Voice
We use two distinct typefaces to balance character with technical precision.

*   **Display & Headlines (Manrope):** This is our "Voice." Manrope provides a modern, geometric authority. Use `display-lg` for hero financial figures and `headline-md` for section titles. 
*   **Body & Labels (Inter):** This is our "Utility." Inter is used for all functional data, descriptions, and inputs. It ensures maximum legibility at small scales, particularly for mobile UX.
*   **Hierarchy Strategy:** Create high-contrast pairings. A large `display-sm` headline should be paired with a `label-md` in `on-surface-variant` to create an editorial rhythm that guides the eye naturally through financial data.

## 4. Elevation & Depth
We eschew traditional "drop shadows" in favor of **Tonal Layering** and **Ambient Light.**

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. This creates a "soft lift" that feels organic to the screen.
*   **Ambient Shadows:** When an element must float (e.g., a mobile bottom sheet), use a shadow with a blur radius of `24px`, an offset of `y: 8px`, and a color derived from `on-surface` at 6% opacity. This mimics natural light rather than digital "glow."
*   **The "Ghost Border" Fallback:** If a container requires further definition for accessibility, use a **Ghost Border**: `outline-variant` (#c5c6cd) at 15% opacity. Never use a 100% opaque border.
*   **Glassmorphism:** Use semi-transparent layers for mobile headers to allow the content to bleed through as the user scrolls, creating a sense of continuity and depth.

## 5. Components

### Cards & Functions
*   **Style:** Background `surface-container-lowest`. 
*   **Constraint:** No borders. Use `xl` (0.75rem) roundedness for a friendly but professional feel.
*   **Layout:** Forbid the use of divider lines. Separate card content using `1.5rem` of vertical white space or a subtle shift to `surface-container-high` for internal header sections.

### Buttons
*   **Primary:** Gradient of `primary` to `primary-container`. Typography: `title-sm` (Inter) in `on-primary`. Roundedness: `lg` (0.5rem).
*   **Secondary:** Background `secondary-container`, text `on-secondary-container`. No border.
*   **Tertiary (Ghost):** No background. Use `on-surface` for text with a `primary` icon.

### Input Fields
*   **Surface:** `surface-container-highest` (#e0e3e5).
*   **Indicator:** Instead of a full border, use a 2px bottom-stroke of `primary` only when the field is focused. 
*   **Typography:** Floating labels using `label-sm`.

### Chips & Status
*   **Financial Indicators:** Use `error_container` for negative trends and a custom success green (derived from the tertiary logic) for positive.
*   **Shape:** `full` (pill-shaped) roundedness to contrast against the architectural squareness of the cards.

### Navigation (Mobile Optimized)
*   **Bottom Bar:** `surface` with 90% opacity and backdrop-blur. 
*   **Icons:** Modern, thin-stroke (2px) icons using `on-surface-variant`. Active state uses `primary` with a small dot indicator below.

## 6. Do's and Don'ts

### Do
*   **DO** use `Manrope` for all large currency values to make them feel prestigious.
*   **DO** use asymmetric margins (e.g., 24px left, 16px right) on desktop to create an editorial "feel," then snap to a balanced 20px margin on mobile.
*   **DO** prioritize "white space as a separator." If you feel the need to add a line, add 8px of padding instead.

### Don't
*   **DON'T** use pure black (#000000) for text. Always use `on-surface` (#191c1e) to maintain the blue-grey tonal harmony.
*   **DON'T** use standard Material Design "elevated" shadows. They feel too "generic app." Stick to tonal shifts.
*   **DON'T** crowd the mobile viewport. If a card has too much data, use a horizontal scroll (carousel) within the card rather than stacking vertically and creating a "long scroll" fatigue.