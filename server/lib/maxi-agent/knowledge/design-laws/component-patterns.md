# Component Patterns — Picasso Design Law §5.2

This document defines the canonical component patterns for every interactive element Picasso can render. Every component described here must ship with all applicable states defined **before** it is considered complete. Partial components are rejected output.

---

## 1. Stateful Component Architecture

### 1.1 The State-First Rule

Every interactive element must define all applicable states in its specification. If a state is not explicitly styled, the component is incomplete and the screen is rejected.

The mandatory state taxonomy:

| Element Type                | Required States                                                                 |
|----------------------------|----------------------------------------------------------------------------------|
| Button                     | default, hover, pressed/active, focus-visible, disabled, loading                 |
| Text Input / Textarea      | default, placeholder, focused, filled, error, disabled, read-only                |
| Select / Combobox          | closed, open, option-hover, selected, disabled                                   |
| Checkbox                   | unchecked, checked, indeterminate, focused, disabled                             |
| Radio                      | unchecked, checked, focused, disabled                                            |
| Toggle / Switch            | off, on, focused, disabled                                                       |
| Link                       | default, hover, pressed, focus-visible, visited (optional)                       |
| Interactive Card / Row     | default, hover, pressed                                                          |
| Modal / Dialog             | closed, open (with backdrop), transitioning-in, transitioning-out                |
| Tooltip / Popover          | hidden, visible (triggered), transitioning                                       |

### 1.2 State Transition Timing

| Transition      | Duration    | Easing          | Notes                                      |
|-----------------|-------------|-----------------|--------------------------------------------|
| hover           | 100–150 ms  | ease-out        | Quick feedback, no lingering glow          |
| focus-visible   | 0 ms        | none            | Immediate ring appearance                  |
| pressed/active  | 0–50 ms     | ease-in         | Near-instant, communicates physical press  |
| loading entry   | 150 ms      | ease-out        | Spinner fade-in, disable interaction       |
| loading exit    | 100 ms      | ease-in         | Content replacement should be fast         |
| success display | 2000 ms     | ease-out        | Show confirmation, then auto-dismiss       |
| modal open      | 150–200 ms  | ease-out        | Fade + scale (0.97→1) + backdrop fade      |
| modal close     | 100–150 ms  | ease-in         | Faster exit than entry                     |
| skeleton→content | 150 ms     | ease-in-out     | Cross-fade, no layout shift                |

---

## 2. Button Patterns

### 2.1 Variants

Every product must define these button variants. No more than **four** visual button styles per product.

| Variant      | Purpose                                           | Usage Limit                           |
|-------------|----------------------------------------------------|---------------------------------------|
| Primary     | Main CTA per screen, destructive on confirmation  | Exactly 1 per screen                  |
| Secondary   | Alternative action, complement to primary          | 0–2 per screen                        |
| Tertiary    | Subtle actions, inline links as buttons            | Unlimited (lowest visual weight)      |
| Ghost       | Icon-only, toolbar actions, row actions            | Unlimited (no background)             |
| Destructive | Delete, remove, irreversible actions               | 1 per confirmation flow               |

### 2.2 Button States — Visual Treatment

#### Primary Button

- **Default:** Accent background (e.g. `bg-accent`), white/neutral-50 text, no border. `px-5 py-2.5`, rounded as per the product radius philosophy. Font-weight: 500 or 600. Font-size: 14–16 px.
- **Hover:** Darken accent by 8–12% (`brightness(0.92)` or a darker step token). Duration: 150ms ease-out.
- **Pressed/Active:** Darken by 15–20% and optionally scale down to 0.97 (`scale-[0.97]`). Duration: 50ms ease-in. Communicates physical depression.
- **Focus-visible:** 2–3 px ring in the accent color, offset 2 px from the button edge. Duration: 0ms. Must appear immediately on keyboard Tab.
- **Disabled:** Reduce opacity to 40–50%. Gray out background to `neutral-300` (light) or `neutral-700` (dark). No hover/pressed effects. Cursor: `not-allowed`. **CRITICAL:** A disabled primary button must always include a visible explanation of *why* it is disabled (tooltip on hover, helper text nearby, or inline message below the button). A disabled button with no explanation is rejected output.
- **Loading:** Replace button text with a spinner (16–20px) while preserving button width. Button text becomes `visibility:hidden` (not `display:none`) to prevent layout shift. The spinner uses the text color. Button is non-interactive during loading. Minimum display: 600ms (never flash a spinner for sub-300ms operations — use optimistic UI instead).

```css
/* Example primary button specification */
.btn-primary { background: var(--accent); color: #fff; padding: 10px 20px; border-radius: var(--radius); font-weight: 600; }
.btn-primary:hover { filter: brightness(0.92); transition: filter 150ms ease-out; }
.btn-primary:active { filter: brightness(0.82); transform: scale(0.97); transition: all 50ms ease-in; }
.btn-primary:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
```

#### Secondary Button

- **Default:** Transparent or `neutral-50` background. 1–1.5 px border in `neutral-300`. Text in accent or `neutral-800`. Same padding and sizing as primary.
- **Hover:** Border darkens to `neutral-400`, background shifts to `neutral-100` (or equivalent). Duration: 150ms.
- **Pressed:** Background to `neutral-200`, border to `neutral-500`. Scale: 0.97.
- **Focus-visible:** Same accent ring as primary. Offset: 2px.
- **Disabled:** Same opacity reduction as primary. Border fades to `neutral-200`. With explanation.
- **Loading:** Same spinner logic as primary. Spinner matches the text color (accent or neutral-800), NOT white.

#### Tertiary / Link Button

- **Default:** No background, no border. Accent text color. Padding: `px-2 py-1` or inline with text. Underline on hover only.
- **Hover:** Underline appears or text darkens 10%. No background change.
- **Pressed:** Text darkens 15%.
- **Focus-visible:** Same accent ring. Offset: 2px.
- **Disabled:** Opacity 0.4. No underline.

#### Destructive Button

- Follows the Primary or Secondary button skeleton but uses `red-600` as accent. Never use red for non-destructive CTAs.

### 2.3 Button Sizing Scale

| Size    | Height | Padding (X) | Font Size | Icon Size | Use Case                          |
|---------|--------|-------------|-----------|-----------|-----------------------------------|
| XS      | 28 px  | 8 px        | 12 px     | 14 px     | Inline table actions, tags        |
| SM      | 32 px  | 12 px       | 13 px     | 16 px     | Compact toolbars, card actions    |
| MD      | 40 px  | 16–20 px    | 14 px     | 18–20 px  | Default. Most CTAs, forms          |
| LG      | 48 px  | 24 px       | 16 px     | 20–24 px  | Hero CTAs, signup, major actions  |

### 2.4 Button Layout Rules

- **Primary is always first** in reading order (left in LTR, right in RTL). Secondary follows.
- **Cancel→Confirm:** Cancel (secondary/ghost) appears left, Confirm (primary) appears right.
- **Destructive pair:** Cancel left (secondary), "Delete" / "Remove" right (destructive primary). Never make the cancel action primary.
- **Single button in empty states:** Primary variant, centered below the copy. Never use secondary for the single CTA in an empty state.
- **Icon + text buttons:** Icon left of text (16–20 px icon with 6–8 px gap). Never icon-right unless it's an expand/collapse chevron.
- **Icon-only buttons:** 40×40 px minimum touch target. `aria-label` is REQUIRED.

---

## 3. Text Input Patterns

### 3.1 States — Visual Treatment

#### Default

- Background: `neutral-50` or `white`. Border: 1–1.5 px `neutral-300`. Padding: `px-3 py-2`. Rounded to match product radius. Font: 14–16 px, body font family. Height: 40 px (MD default).
- Placeholder text: `neutral-400`, italic optional. Must be a descriptive example, not a label replacement ("you@example.com", not "Email").

#### Focused

- Border: accent color (replace the neutral border). Ring: 0–3 px accent color, offset 0 or 1 px.
- The accent ring is **optional** on inputs — if the product uses no-ring designs, the border color change alone is sufficient. But one of the two (ring or border recolor) MUST be present.
- Placeholder text shifts to `neutral-300` so it recedes visually when user focuses.

#### Filled (has value)

- Border remains `neutral-300` (or accent if still focused). No visual change from default except: no placeholder visible. The label (if floating) is now in its top position with smaller font.
- If using a checkmark or success indicator inside the input, show it only after async validation (e.g., "Username available"). Never show validation results inline for simple filled state.

#### Error

- Border: `red-500` or `red-600`. Background: `red-50` (optional, use sparingly). Icon: a small alert circle (16 px) inside the right of the input.
- Helper/error text: Below the input, 12–13 px, `red-600`. Placement: 4–6 px below the border. Must describe **what is wrong and how to fix it**. Bad: "Invalid email". Good: "Enter a valid email, like name@domain.com".
- The input must maintain focus state (accent ring) even in error. The error border is additive, not replacement.
- If a label exists, it turns `red-600` as well.

#### Disabled

- Background: `neutral-100`. Border: `neutral-200`. Text: `neutral-400`. Cursor: `not-allowed`.
- If the disabled input has a value, the text remains visible at reduced opacity (0.5–0.6). Never hide the value in a disabled field.
- **Explanation required:** If disabled, a tooltip or helper text must explain why. Example: "Upgrade to Pro to edit this field."

#### Read-Only

- Background: `neutral-50` (or no background change). Border: `neutral-200` or dashed `neutral-300`. Text: full opacity — this is content the user can read and copy, not a disabled control. Cursor: `default` (not `not-allowed`).
- A subtle "read-only" badge or icon (lock, 14 px) may appear at the right of the input.
- Read-only text is selectable for copy. Disabled text is not.

### 3.2 Input Variants

| Variant     | Visual Distinction                                              | When to Use                                |
|-------------|-----------------------------------------------------------------|--------------------------------------------|
| Outlined    | Border on all sides. Standard.                                  | Default. All forms.                         |
| Underlined  | Border-bottom only. Background transparent or none.             | Inline editing, material-style forms.       |
| Filled      | Background `neutral-100`, border-bottom. No side/top borders.   | Compact forms, search, settings panels.     |
| Ghost       | No border, no background. Border appears on focus.              | Inline table editing, minimal UI.           |

### 3.3 Helper Text Rules

- **Always present on complex fields** (passwords, URLs, codes, monetary amounts). Optional on simple fields (name, email).
- Position: 4–6 px below the input. Font: 12–13 px. Color: `neutral-500`.
- Helper text is the **description** of what the field expects. Error text is the **correction message**. They occupy the same space but never appear simultaneously.
- When error occurs: helper text is replaced by error text. On error resolution: error text disappears, helper text returns.

### 3.4 Labeling

- Every input must have a visible label. The label is positioned above the input, 4–6 px gap.
- Label font: 13–14 px, weight 500. Color: `neutral-700` (light) or `neutral-300` (dark).
- Floating labels (label inside the input, moves up on focus) are permitted but MUST NOT obscure the placeholder when the input is empty. If floating label blocks the placeholder, downgrade to standard top-positioned label.
- Required field indicator: a red asterisk (`*`) after the label text, or "(required)" in `neutral-500` at 12 px. Never put the asterisk inside the input.

### 3.5 Textarea

- Same state rules as text input.
- Minimum height: 80 px (3–4 lines). Maximum before scroll: 200–240 px (desktop).
- Resize handle: vertical only (`resize: vertical`). Never both axes.
- Character count: optional, displayed below-right (12 px, `neutral-500`). Turns to `amber-500` at 80% of limit, `red-500` at 100%.

---

## 4. Checkbox & Radio Patterns

### 4.1 Checkbox States

- **Unchecked:** Default. 16–20 px square. Border: 1.5–2 px `neutral-400`. Background: transparent or `white`. Border-radius: 3–4 px (crisp/soft philosophy) or 2 px (sharp philosophy).
- **Checked:** Same dimensions. Background: accent color. Border: accent color. Checkmark: white, 2–2.5 px stroke, centered. Animate checkmark draw-in: 100–150ms.
- **Indeterminate (checkbox only):** Same dimensions. Background: accent color. Instead of a checkmark, a horizontal dash (2.5–3 px thick, white) spanning 60% of the box width. Used for "select all" when some children are selected. **Do not use indeterminate for radio buttons — there is no indeterminate radio state.**
- **Focused:** Same focus ring as buttons: 2–3 px accent ring, offset 2 px from the box edge. Duration: 0ms.
- **Disabled (unchecked):** Border `neutral-300`, background `neutral-100`. No hover effect. Cursor: `not-allowed`.
- **Disabled (checked):** Background `neutral-400`, border `neutral-400`. Checkmark in `neutral-200`. Text label at 0.4 opacity.
- **Disabled (indeterminate):** Background `neutral-400`, dash in `neutral-200`.

### 4.2 Radio States

- Identical state logic to checkbox with these differences:
  - Shape: circle (border-radius: 50%).
  - Checked indicator: filled inner circle (6–8 px diameter for a 18 px radio), accent color, centered.
  - No indeterminate state. Ever.
  - Animation: inner circle scales from 0 to full size, 100–150ms ease-out.

### 4.3 Labeling & Spacing

- Label text sits to the right of the control with a 8–10 px gap.
- Label font: 14–16 px, body font. Color: `neutral-800` (unchecked), no change on check (do not recolor the label on selection).
- Click target: the entire label + control area is clickable. Minimum 44×44 px click target on touch devices.
- Vertical spacing between checkbox/radio options in a group: 12–16 px gap.
- Group label (the question or fieldset legend): 14–16 px, weight 500, `neutral-700`. Sits above the option list with 8 px gap.

### 4.4 Checkbox/Radio Group Layout

- **Vertical stack (default):** Each option on its own line. Preferred for >3 options or long labels.
- **Horizontal inline:** Options in a single row. Maximum 3–4 options. Gap: 16–24 px between options.
- Never mix horizontal and vertical in the same group.

---

## 5. Toggle / Switch Patterns

### 5.1 Anatomy & Sizing

| Part       | Dimensions          | Details                                      |
|------------|---------------------|----------------------------------------------|
| Track      | 36–44 px W × 20–24 px H | Pill shape (border-radius: 9999px)        |
| Thumb      | 16–20 px W × 16–20 px H | Circle (border-radius: 50%). Dropshadow: 0 1px 3px rgba(0,0,0,0.15) |
| Label      | 14–16 px font       | Sits to the left or right, 8–12 px gap       |

### 5.2 States

- **Off:** Track background `neutral-300` (light) or `neutral-600` (dark). Thumb: white, positioned at the left edge (2 px padding from track edge). No border on track.
- **On:** Track background: accent color. **Never green unless the product accent is green or the toggle controls a success/published state explicitly.** Thumb: white, positioned at the right edge. Transition: thumb slides and track color shifts simultaneously, 150–200ms ease-out.
- **Focused:** Focus ring on the track: 2–3 px accent ring, offset 2 px.
- **Disabled (off):** Track `neutral-200`, thumb `neutral-100`. Opacity: 0.5–0.6 overall.
- **Disabled (on):** Track accent at 0.4 opacity, thumb white at 0.6 opacity.

### 5.3 Animation Rules

```css
.toggle-track {
  transition: background-color 150ms ease-out;
}
.toggle-thumb {
  transition: transform 150ms ease-out;
}
.toggle.on .toggle-thumb {
  transform: translateX(16px); /* track width minus thumb width minus 4px padding */
}
```

- Never animate the toggle on page load. Only on user interaction.
- Never use a toggle as a submit button. Toggles are for immediate settings changes (light/dark mode, notifications on/off). If the action requires a submit button, use a checkbox.

### 5.4 Anti-Patterns

- **Never** use a toggle for binary choices in forms (e.g., "I agree to terms"). Use a checkbox. Toggles are for settings, not agreements.
- **Never** put two toggles side by side with no gap. Minimum 16 px between toggles.
- **Never** use a toggle that looks like a button. The track/thumb anatomy must be visually obvious.

---

## 6. Dropdown / Select Patterns

### 6.1 States

- **Closed:** Default appearance identical to a text input (border, background, padding). The selected value text (or placeholder) is left-aligned. A chevron-down icon (16–18 px) sits at the right edge with 12 px right padding. Chevron color: `neutral-500`.
- **Open:** The trigger input maintains focus styling (accent border/ring). The chevron rotates 180° (optional but recommended, 150ms). The dropdown menu appears below with a 4 px gap, shadow level 2, border-radius matching the product philosophy.
- **Option-default:** Each option is a row: 40–44 px height, `px-3`, 14 px font. Background: transparent. Cursor: pointer.
- **Option-hovered:** Background `neutral-100` (light) or `neutral-800` (dark). Duration: 100ms.
- **Option-selected:** A checkmark icon (16 px) at the right of the row. Background: optional `neutral-50` or no background change. Font-weight: 500 (subtly bolder than unselected).
- **Option-focused (keyboard):** Background `neutral-100` + accent colored left-border (3 px) or just the background. The focused option scrolls into view.
- **Disabled:** Same input disabled rules. Dropdown cannot be opened.

### 6.2 Dropdown Menu Container

- Width: minimum 160 px, maximum 320 px. Matches the trigger width at minimum; may be wider if content requires it.
- Max-height: 280–320 px (6–8 visible options). Scroll if content exceeds.
- Shadow: level 2 (see megadesign elevation scale). Border: 1 px `neutral-200`.
- Z-index: 20–30 (above other content, below modals).
- Border-radius: product radius. Top corners may be sharper if the menu is flush-attached to the trigger.

### 6.3 Keyboard Navigation

| Key          | Action                                                       |
|-------------|--------------------------------------------------------------|
| Enter/Space | Open the dropdown when closed. Select highlighted option when open. Close. |
| Escape      | Close the dropdown. Return focus to the trigger.             |
| Arrow Down  | Move highlight to next option. Wrap from last to first.      |
| Arrow Up    | Move highlight to previous option. Wrap from first to last.  |
| Home        | Move highlight to first option.                              |
| End         | Move highlight to last option.                               |
| Tab         | Close dropdown (without selecting). Move focus to next focusable element. |

When the dropdown opens, if a value is already selected, the keyboard highlight starts on that selected option. If no value is selected, highlight starts on the first option.

### 6.4 Multi-Select Variant

- When multiple selections are possible, selected items appear as **chips/tags** inside the trigger input area.
- Chips: `neutral-100` background, 24–28 px height, 12 px font, 6 px padding. "X" remove icon (14 px) on the right of each chip.
- The trigger height expands to accommodate chips (min-height: 40 px, auto-grow).
- Options in the menu use checkboxes (not checkmarks) to indicate selection — this signals multi-select.
- A "Select all" / "Clear all" row sits at the top of the menu, separated by a divider below it.

### 6.5 Autocomplete / Combobox

- Same visual treatment as select, but the trigger is a text input. As user types, matching options filter in the dropdown.
- No more than 8 visible options. A "no results" row appears if filtering yields zero matches: "No results for '[query]'" in `neutral-500` at 13 px. Optionally add a "Add new" action.
- Keyboard: Arrow keys navigate filtered options. Enter selects. Escape closes (restoring previous value).

---

## 7. Interactive Card Patterns

### 7.1 When Cards Are Interactive

A card is interactive if clicking/tapping anywhere on the card navigates to a detail view, opens a modal, or triggers an action. If a card has a single CTA button inside it but the card body itself is not clickable, it is NOT an interactive card — it is a static card with a button. Static cards must not have hover or pressed states.

### 7.2 States

- **Default:** Standard card styling (see megadesign surface rules: bordered card, tonal band, or divided list). No shadow unless the product uses shadows on cards. If shadow, level 1 (subtle).
- **Hover:** Subtle lift or border change — **not both**. Choose one:
  - *Lift approach:* Translate Y by −2 to −4 px, increase shadow from level 1 to level 2. Duration: 150ms ease-out.
  - *Border approach:* Change border from `neutral-200` to accent color (at 0.3–0.5 opacity) or `neutral-400`. Duration: 150ms.
  - *Background approach:* Shift background from `white`/`neutral-50` to `neutral-100`. Duration: 150ms.
  - Never combine lift + border change — pick one interaction vector.
- **Pressed/Active:** Remove the lift (return to Y=0) OR darken the background further. Never keep the lift during press. Scale to 0.98–0.99 for 50ms. Cursor remains `pointer`.
- **Focus-visible:** When navigating cards via keyboard (Tab), apply the same focus ring as buttons: 2–3 px accent ring, offset 2 px from the card edge. The entire card must receive focus as a single tab stop.
- The cursor must be `pointer` on the entire card surface when it is interactive.

### 7.3 Card Content Rules for Interactive Cards

- **Card title:** 16–18 px, weight 600. Left-aligned. Never center-aligned.
- **Card description:** 13–14 px, `neutral-600`, max 2 lines (line-clamp-2). Left-aligned.
- **Card metadata:** 12 px, `neutral-500`, bottom of the card.
- **Card action hint:** A subtle chevron-right icon (16 px) at the top-right or bottom-right of the card signals clickability. This is the visual affordance that the card is navigable.
- **Avoid:** Cards that are entirely clickable but have no visual signals of interactivity. Users should not have to guess.

### 7.4 Card Grid Composition

- Maximum **3 cards per row** on desktop. Never 4. Never 5. Never 6.
- Cards in a row must have equal height (using flex/grid stretch). Never let cards have different heights in the same row.
- Card grid gutters: 24 px (desktop), 16 px (tablet), 12 px (mobile).
- Card content within a row must vary. Never repeat identical card structures (same icon size, same title length, same description pattern, same metadata type). Every 3-card row must have intentional visual differentiation — one card might have a chart, one a list, one a stat. If they're all the same shape, use a table or a list instead.

---

## 8. Loading Patterns

### 8.1 Decision Tree

```
Operation expected duration?
├─ <300 ms → Show NOTHING. Use optimistic UI. Don't flash a loader.
├─ 300–1000 ms → Show local skeleton or disable the trigger button (spinner inside button).
├─ 1–5 seconds → Show full skeleton screen matching the layout shape.
├─ 5+ seconds → Show skeleton + progress bar (determinate if % known, indeterminate if not).
└─ Unknown → Show skeleton with shimmer animation. Add progress bar after 5 seconds.
```

### 8.2 Skeleton Screens

**Rule: Match the layout shape exactly.** The skeleton is a wireframe preview of the content that will load. When content replaces the skeleton, there must be zero layout shift (CLS = 0).

- Preserve the nav shell (sidebar, topbar, breadcrumbs) during loading. Only the content area is skeletonized.
- Skeleton elements use `neutral-200` to `neutral-300` background with a shimmer animation (linear gradient sweep, 1.5–2 second cycle).
- Skeleton shapes: lines of text (varying widths, last line 60% width), rectangles for images/cards, circles for avatars.
- Never show a skeleton for an empty state. If the page will be empty, skip the skeleton and show the empty state immediately.
- Fade-out skeleton, fade-in content: 150ms cross-fade.

### 8.3 Spinner

**Rule: Only for operations >300ms.** A spinner that appears and disappears in under 300ms is visual noise and startles the user.

- Spinner size: 16–20 px for inline (inside buttons), 24–32 px for page-level, 40–48 px for full-page loading.
- Spinner color: accent color (primary). Centered in its container.
- Spinner label: optional text below the spinner (13–14 px, `neutral-500`): "Loading...", "Fetching data...", "Processing...". Must be specific. Never say "Please wait" — it's filler.
- Spinner stroke: 2–3 px. Duration of one full rotation: 0.8–1.2 seconds. Easing: linear.

### 8.4 Progress Bar

- **Determinate (known %):** Track: `neutral-200`, 4–8 px height, pill shape, full width of container. Fill: accent color, same height, left-to-right transition, 200–300ms ease-out on each percentage jump. Percentage text: right of the bar or centered in the fill, 12–13 px, `neutral-600`.
- **Indeterminate (unknown):** Track: same. Fill: accent color, 30–40% of track width, slides left-to-right with a repeating animation (1–1.5 second cycle). Never use an indeterminate bar when you know the percentage — it disrespects the user's time.
- Progress bars appear below the primary heading of the loading section, 12–16 px gap.
- Never show a progress bar on a screen that loads in under 1 second.

### 8.5 Loading Anti-Patterns

- **NEVER** show a blank white screen during loading. Always show the nav shell + skeleton.
- **NEVER** show a spinner for sub-300ms operations. Optimistic UI renders the expected result immediately.
- **NEVER** use a progress bar that jumps from 0% to 100% instantly. Either track real progress or use indeterminate.
- **NEVER** let the skeleton layout differ from the loaded content layout. No layout jump.

---

## 9. Empty State Patterns

### 9.1 First-Use Empty State

When a user has never created/viewed content in this section:

- **Illustration:** A simple, line-art illustration (32–48 px icon or 120–200 px illustration). Color: `neutral-300` to `neutral-400`. Never use the accent color for the empty-state illustration — it competes with the CTA.
- **Heading:** 18–24 px, weight 600. Describes what this section is for. Example: "No projects yet" — not "Empty" or "Nothing here".
- **Description:** 14 px, `neutral-500`, max 50–55 characters. Explains what happens when the user takes action. Example: "Create your first project to start tracking changes."
- **CTA:** A single primary button. Centered below the description with 24 px gap. Button text is action-oriented: "Create project", "Add your first task", "Invite team members".
- Layout: vertically centered in the available content area (not the full viewport — the nav shell is still present).

### 9.2 No-Results Empty State

When the user has applied filters or performed a search that yields zero results:

- **Icon:** A search/filter-related icon (search, filter, magnifying glass). 32–48 px. Color: `neutral-400`.
- **Heading:** 16–18 px, weight 600. "No results for '[search query]'" or "No matching [entity]".
- **Description:** 14 px, `neutral-500`. Suggests corrective action: "Try adjusting your search or filters."
- **Action:** A secondary button: "Clear filters" or "Reset search". Positioned below the description.
- **Never** show a generic "No results" without context about what was searched and how to fix it.

### 9.3 No-Data Empty State

When data exists in the database but none matches the current view context (e.g., empty inbox, empty notifications):

- **Icon:** A contextually relevant icon (inbox, bell, calendar). 32–48 px. Color: `neutral-400`.
- **Heading:** 16–18 px, weight 600. "All caught up" / "No notifications" / "Inbox zero".
- **Description:** 14 px, `neutral-500`. Contextual help: "New notifications will appear here."
- **No CTA** is required unless there's a relevant action ("View archived notifications").

### 9.4 Empty State Anti-Patterns

- **NEVER** show a blank area with no message. If content is empty, explain why.
- **NEVER** use a giant illustration that pushes the CTA below the fold.
- **NEVER** use the accent color for empty-state illustrations — the CTA is the visual priority.
- **NEVER** use "No data" as the heading. Be specific about what is missing.

---

## 10. Error Patterns

### 10.1 Inline Error (Field-Level)

Use when a single field has a validation error.

- **Visual:** Red border on the input. Optional: red-50 background on the input. Alert-circle icon (16 px) inside the right of the input. Red error text below the input.
- **Error text requirements:**
  - 12–13 px, `red-600`. 4–6 px below the input.
  - Must state **what is wrong** and **how to fix it**.
  - Bad: "Invalid input." Good: "Password must be at least 8 characters."
  - Bad: "Required." Good: "Email address is required."
- The input retains focus. The error text appears immediately on validation failure (on blur or on submit, not on every keystroke unless after first error).
- Multiple field errors: each field gets its own inline error. The first field with an error receives focus. A summary banner at the top is optional but not required.

### 10.2 Banner Error (Section-Level / Form-Level)

Use when a form submission fails globally (API error, network failure, authentication required).

- **Visual:** A banner across the top of the form or section. Background: `red-50`. Border-left: 3–4 px `red-500`. Padding: `px-4 py-3`. Rounded: product radius (or 0 for full-width).
- **Icon:** Alert-circle or warning-triangle (18–20 px) at the left, `red-600`.
- **Text:** 14 px, `red-700` or `red-800`. States what went wrong. Example: "Unable to save changes. The server returned an error. Please try again."
- **Action:** Optional "Retry" or "Dismiss" button at the right.
- The banner sits between the page heading and the form, or at the top of the section. 16–24 px margin below it.

### 10.3 Toast Error (Non-Field Errors)

Use for errors that are not tied to a specific field or page: copy failure, sync failure, permission denied on an action.

- **Position:** Bottom-right (desktop) or bottom-center (mobile) of the viewport. Overlays content. Z-index: 50.
- **Visual:** Background: `neutral-900` (dark toast) or `red-50` with `red-600` border. Text: `neutral-50` (dark) or `red-800` (light). Icon: alert-circle (18–20 px).
- **Content:** Brief error message, 13–14 px. Max 2 lines. An optional action button: "Retry", "Undo".
- **Duration:** 5–8 seconds for errors (longer than success toasts, since users need time to read the problem). Auto-dismiss.
- **Animation:** Slide in from the right (desktop) or bottom (mobile), 200ms ease-out. Slide out to the right/bottom, 150ms ease-in.
- **Stacking:** If multiple toasts appear, stack them vertically with 8 px gap. Max 3 visible toasts. Oldest dismisses first.

### 10.4 Full-Page Error (Unrecoverable)

Use when the entire page cannot load: 500 errors, lost connection, session expired.

- **Layout:** Vertically centered in the viewport (or content area, if nav shell is available).
- **Icon:** A large illustration or icon (64–80 px). Color: `neutral-300` or `red-300`.
- **Heading:** 20–28 px, weight 600. "Something went wrong" / "Unable to load this page".
- **Description:** 14–16 px, `neutral-500`. Max 60 characters. Specific if possible: "The server returned a 500 error." / "Check your internet connection and try again."
- **Actions:** Primary button: "Try again" (retry). Secondary/tertiary: "Go to home" or "Contact support".
- Full-page errors must still respect the brand. Do not show a generic browser error page.

### 10.5 Error Anti-Patterns

- **NEVER** show a generic "An error occurred" message. Be specific about what failed.
- **NEVER** use a toast for a field validation error. Use inline errors.
- **NEVER** clear all form fields on a submission error. Preserve user input.
- **NEVER** show a toast error and a banner error simultaneously for the same error. Pick the most localized pattern.
- **NEVER** use `alert()` or `confirm()` browser dialogs for errors. Use inline UI.

---

## 11. Success Patterns

### 11.1 Confirmation Toast

- **Position:** Bottom-right (desktop) or top-center (mobile). Z-index: 50.
- **Visual:** Background: `neutral-900` (dark) or `green-50` (light). Icon: check-circle (18–20 px), green. Text: 13–14 px, states what succeeded. Example: "Project 'Q4 Roadmap' created."
- **Duration:** 2000–3000 ms. Auto-dismiss. If the success toast includes an "Undo" action, extend to 8000ms.
- **Animation:** Slide in from right, 200ms ease-out. Slide out to right, 150ms ease-in.

### 11.2 Inline Success

Use when a field or section updates successfully without a full page reload (inline edit, AJAX save).

- On the updated element: brief green-50 background flash or a checkmark icon appears for 2000ms, then fades.
- Optional: a "Saved" text label appears nearby (12–13 px, `green-600`), fades after 2000ms.

### 11.3 Redirect with Banner

Use after form submission that redirects to a new page (e.g., after creating a project, redirect to the project detail).

- A success banner at the top of the destination page: background `green-50`, border-left 3–4 px `green-500`, padding `px-4 py-3`. Text: 14 px, `green-700`. Example: "Project created successfully."
- The banner dismisses automatically after 5 seconds or on user click.

### 11.4 Success Anti-Patterns

- **NEVER** show a success toast and then immediately redirect. The toast won't be seen.
- **NEVER** show a success toast for automatic, background actions the user didn't trigger (e.g., auto-save drafts).
- **NEVER** use a red/green color pair exclusively without icons. Add a checkmark or alert icon.

---

## 12. Component Composition Architecture

### 12.1 Taxonomy

| Level      | Definition                                                     | Examples                                  |
|------------|----------------------------------------------------------------|------------------------------------------|
| Primitive  | Atomic visual token: a single color, spacing value, font size | `--accent`, `16px`, `weight-500`          |
| Atom       | Single-purpose UI element with no children                    | Button, Input, Icon, Badge, Avatar        |
| Molecule   | Composition of 2–5 atoms serving one function                 | SearchBar (Input + Button), FormGroup (Label + Input + HelperText), MenuItem (Icon + Text + Chevron) |
| Organism   | Self-contained section of molecules forming a functional unit | Navbar, Sidebar, DataTable, Form, CardGrid, Modal |
| Template   | Page-level arrangement of organisms in a specific layout      | Dashboard template, Settings template, Detail page template |
| Page       | A complete screen instance with real content                  | "Project Dashboard", "Account Settings"   |

### 12.2 Composition Rules

- **Atoms never contain atoms directly.** Composition is always through molecules. If an atom seems to contain another atom (e.g., an IconButton), it's actually a molecule — define it as such.
- **Molecules must serve exactly one user function.** If a molecule has two unrelated jobs, split it. A "SearchBar" that also filters and sorts is an organism, not a molecule.
- **Organisms are reorderable across templates.** A DataTable organism must work inside a Dashboard template and a Settings template without modification.
- **Templates contain organisms, not atoms.** If a template directly references a Button, the abstraction is broken — promote the Button to a molecule first.

### 12.3 Example: DataTable Component Hierarchy

```
Page: "User Directory"
└── Template: "List Detail"
    ├── Organism: Topbar (SearchBar + FilterMenu + AddUserButton)
    ├── Organism: DataTable
    │   ├── Molecule: TableHeader (ColumnLabel atoms × N + SortIcon)
    │   ├── Molecule: TableRow (TableCell atoms × N + RowActions)
    │   │   ├── Atom: Avatar
    │   │   ├── Atom: Text (name)
    │   │   ├── Atom: Badge (role)
    │   │   ├── Atom: Text (email)
    │   │   └── Molecule: RowActions (IconButton × 2)
    │   └── Molecule: Pagination (PageButton atoms + PageInfo text)
    └── Organism: EmptyState (when no users)
```

---

## 13. Quick Reference: Component State Checklist

Before marking any component complete, verify:

- [ ] All mandatory states are defined (see table in §1.1)
- [ ] Every state has explicit visual treatment (not "same as")
- [ ] State transitions have declared durations and easings
- [ ] Focus-visible ring is present on every interactive element
- [ ] Disabled states include explanation of why
- [ ] Loading states use appropriate pattern based on operation duration
- [ ] Empty states include illustration + heading + description + appropriate CTA
- [ ] Error states describe what went wrong AND how to fix it
- [ ] No spinner for operations under 300ms
- [ ] No layout shift between skeleton and loaded content
- [ ] Interactive cards have a cursor pointer, hover state, and pressed state

---

*This document is §5.2 of the Picasso agent specification. Any component output that does not define all required states, per §1.1, is incomplete and will be rejected.*
