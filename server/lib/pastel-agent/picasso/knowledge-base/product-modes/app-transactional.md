# Picasso Product Mode: App Transactional

## Mode Definition

**Transactional App** — Software designed for completing specific, task-oriented flows: checkout, booking, multi-step forms, application submissions, onboarding wizards. The user enters with a clear goal, passes through a structured sequence of steps, and exits upon completion. The interface must reduce friction, build trust, and guide the user to completion without distraction.

---

## Core Layout Architecture

### Minimal Chrome Layout

Transactional interfaces strip away all non-essential UI elements. The user's focus must be entirely on the task.

```
┌──────────────────────────────────────────────────────────┐
│ [Logo]     ○──○──○──○     Step 2 of 4         [? Help]   │  ← Minimal header
│                                                          │
│                                                          │
│                                                          │
│                    ┌──────────────────┐                  │
│                    │                  │                  │
│                    │  Focused Content │                  │
│                    │  Area            │                  │
│                    │  (centered,      │                  │
│                    │   max-w-md/lg,   │                  │
│                    │   560–720px)     │                  │
│                    │                  │                  │
│                    │                  │                  │
│                    └──────────────────┘                  │
│                                                          │
│                                                          │
│                                                          │
│  ──────────────────────────────────────────────────────  │  ← Optional footer
│  [Privacy Policy]  [Terms of Service]                    │
└──────────────────────────────────────────────────────────┘
```

| Element | Specification | Required? |
|---|---|---|
| Logo | Top-left, 24–32px height, links to homepage (new tab) | Yes |
| Progress indicator | Top-center, shows current step visually | Yes (for multi-step flows) |
| Help/support link | Top-right, question mark icon or "Need help?" link | Optional |
| Content area | Horizontally and vertically centered, `max-width: 480px–720px` | Yes |
| Footer | Bottom of page, minimal — legal links only | Optional |
| Sidebar / topbar / tabbar | **None.** All standard chrome is removed | — |

### Content Area Width Guidelines

| Step Type | Recommended Max Width | Rationale |
|---|---|---|
| Information gathering (text fields) | `max-w-md` (448px) or `max-w-lg` (512px) | Narrow widths improve form readability and reduce eye travel |
| Review/confirmation | `max-w-lg` (512px) or `max-w-xl` (576px) | Wider to show summary cards |
| Payment/checkout | `max-w-lg` (512px) + order summary side panel (320px) | Two-column layout for desktop |
| Success/confirmation | `max-w-sm` (384px) or `max-w-md` (448px) | Short, punchy message. No scrolling needed |
| Onboarding wizard | `max-w-lg` (512px) or `max-w-xl` (576px) | Room for illustrations + text |

---

## Progress Indicators

### Step Indicator Anatomy

The progress indicator is the primary navigation signal in a transactional flow. It shows the user where they are, where they've been, and where they're going.

```
        Completed         Active          Upcoming          Upcoming
    ┌─────┐           ┌─────┐           ┌─────┐           ┌─────┐
    │  ✓  │───────────│  2  │───────────│  3  │───────────│  4  │
    └─────┘           └─────┘           └─────┘           └─────┘
     Account          Details          Payment         Confirm
```

```
⏺ Completed    ⏺ Active       ○ Upcoming     ○ Upcoming
  Account ────── Details ────── Payment ────── Confirm
```

### State Specifications

| State | Circle Style | Connector Line | Label Style |
|---|---|---|---|
| **Completed** | Filled `accent-500` circle, 28–32px. White checkmark icon inside | `accent-500` solid line, 2px | 12–13px, `accent-500`, weight 500 |
| **Active** | `accent-500` border (2px), white fill, 28–32px. Step number in accent-500 | `neutral-300` line from active to next | 12–13px, `neutral-900`, weight 600 |
| **Upcoming** | `neutral-300` border (2px), white fill, 28–32px. Step number in `neutral-400` | `neutral-300` line | 12–13px, `neutral-400`, weight 400 |

### Step Indicator Placement

| Flow Length | Indicator Style | Placement |
|---|---|---|
| 3–4 steps | Horizontal row of circles + labels | Top-center, 32–48px below header |
| 5–7 steps | Horizontal row of circles + abbreviated labels (or icons only) | Top-center, need to fit width |
| 2 steps | Simple "Step X of 2" text label | Top-left, no visual indicator needed |
| 8+ steps | Break into sub-sections. Show parent steps as indicator + child steps as a sub-indicator | Top with sub-indicator below active parent |

### Label Patterns

| Style | Example | When to Use |
|---|---|---|
| Number + label | `1. Account → 2. Details → 3. Payment` | Standard flows. Most common |
| Icon + label | `👤 Account → 📋 Details → 💳 Payment` | Consumer-facing flows. More visual |
| Label only | `Account → Details → Payment` | Minimal style. No numbering |
| Number only | `1 → 2 → 3` | Vertical space constrained. Use tooltip for full label |

### Responsive Behavior

On viewports narrower than 640px, step labels may need to collapse:
- Show only the active step label + "Step 2 of 4"
- Or show circles only (no labels) with active step highlighted
- Never stack steps vertically — this breaks the linear flow metaphor

---

## Form Design in Transactional Context

### Layout Principles

Forms in transactional flows follow these rules:

```
┌──────────────────────────────┐
│                              │
│  Shipping Address            │  ← Section heading: 18–20px, weight 600
│  ─────────────────────────── │  ← Divider or spacing
│                              │
│  Full Name                   │  ← Label: 13–14px, weight 500, neutral-700
│  ┌──────────────────────────┐│  ← Input: 44–48px height, border neutral-300
│  │ John Doe                 ││     rounded-6px, focus border accent-500
│  └──────────────────────────┘│
│                              │  ← Gap: 24px between fields
│  Street Address              │
│  ┌──────────────────────────┐│
│  │ 123 Main Street          ││
│  └──────────────────────────┘│
│                              │
│  City              State     │  ← Side-by-side fields can be used
│  ┌──────────┐  ┌──────────┐ │     but should not create a multi-column form
│  │          │  │          │ │
│  └──────────┘  └──────────┘ │
│                              │
│  Zip Code                    │
│  ┌──────────────┐            │  ← Narrower fields set their own width
│  │  94105       │            │     (zip code doesn't need to be full-width)
│  └──────────────┘            │
│                              │
└──────────────────────────────┘
```

| Rule | Specification |
|---|---|
| Column layout | Single column. NEVER multi-column forms in transactional flows |
| Field spacing | 24–32px between fields. 40–48px between sections |
| Field width | Generally full-width of container. Narrow widths for short inputs (zip code, CVV, state) |
| Label position | Above the input (not left-aligned, not placeholder-only). Top-aligned labels are fastest to scan |
| Input height | 44–52px for text inputs, selects, and buttons. Large touch targets |
| Required indicator | Red asterisk (*) after label, or "(required)" text in neutral-400 |
| Optional indicator | "(optional)" text in neutral-400 after label |

### Section Grouping

Forms longer than 5–6 fields should be visually grouped into sections.

```
┌──────────────────────────────┐
│                              │
│  Personal Information ────── │
│                              │
│  [Name]                      │
│  [Email]                     │
│  [Phone]                     │
│                              │
│  Shipping Address ────────── │
│                              │
│  [Street]                    │
│  [City]    [State] [Zip]     │
│  [Country]                   │
│                              │
│  ─────────────────────────── │
│                              │
│         [Continue →]          │
│                              │
└──────────────────────────────┘
```

| Section Element | Specification |
|---|---|
| Section heading | 16–18px, weight 600, `neutral-800` |
| Section divider | `1px solid neutral-200` OR 8px spacing below heading |
| Fields per section | 2–6 fields. If a section needs more fields, create a subsection |
| Section spacing | 32–48px between sections |

### Persistent CTA Button

The primary call-to-action button must always be visible and accessible.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌───────────┐  (scrollable content)                     │
│  │ Scrollable │                                          │
│  │  Content   │                                          │
│  │            │                                          │
│  │            │                                          │
│  │            │                                          │
│  └───────────┘                                          │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │              [← Back]          [Continue →]          ││  ← Sticky bottom bar
│  └──────────────────────────────────────────────────────┘│  80–96px, white bg,
└──────────────────────────────────────────────────────────┘  top border

OR: Button inline at bottom of form (NOT sticky) for shorter forms (< 5 fields)
```

| CTA Placement | When to Use |
|---|---|
| Sticky bottom bar | Long forms (> 5 fields), checkout flows, onboarding. Bar is 80–96px tall, white background, `border-top: 1px solid neutral-200` |
| Inline bottom | Short forms (≤ 5 fields), settings pages, confirmation screens |
| Top-right | Single-field forms, search forms, quick actions |

| CTA Style | Specification |
|---|---|
| Primary button (Continue / Submit / Pay) | accent-500 filled, 48–56px height, `min-width: 160px`, full-width on mobile, `font-weight: 600`, 16px font size |
| Secondary button (Back / Cancel) | Ghost or outlined, 48–56px height, neutral-500 border, positioned to the left of the primary button |

### Back Navigation

Users must be able to go back to previous steps.

| Back Pattern | Specification |
|---|---|
| Back button in sticky bar | "← Back" ghost button, left-aligned in sticky bottom bar. Always visible |
| Back link in header | "← Back to [previous step]" text link, top-left of content area. Only for shorter flows |
| Browser back | Should work. Each step has a unique URL or query param |

**Critical rule:** Clicking "Back" must preserve all data the user entered on the current step. Do NOT clear fields on back navigation.

---

## Step Types

### 1. Information Gathering

The most common step type. Users enter data through form fields.

```
┌──────────────────────────────┐
│                              │
│  Create your account         │
│  ─────────────────────────── │
│                              │
│  Full Name *                 │
│  ┌──────────────────────────┐│
│  │                          ││
│  └──────────────────────────┘│
│                              │
│  Email Address *             │
│  ┌──────────────────────────┐│
│  │                          ││
│  └──────────────────────────┘│
│                              │
│  Password *                  │
│  ┌──────────────────────────┐│
│  │ ••••••••••         [👁]  ││  ← Show/hide toggle
│  └──────────────────────────┘│
│  Must be at least 8 characters
│                              │
│  Role                        │
│  ┌──────────────────────────┐│
│  │ Select your role...   ▾  ││  ← Select dropdown
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │ ☐ I agree to the Terms    ││  ← Checkbox
│  └──────────────────────────┘│
│                              │
│         [Continue →]          │
│                              │
└──────────────────────────────┘
```

| Field Type | Specification |
|---|---|
| Text input | 44–52px height, border `1px solid neutral-300`, rounded-6 or 8px, focus: border `accent-500` + ring 3px `accent-100` |
| Select / Dropdown | Same height as text inputs. Chevron icon on right. Native `<select>` or custom dropdown |
| Textarea | Min-height 100–150px, resizable vertical only |
| Date picker | Input with calendar icon right. Opens date picker popover on click or focus |
| File upload | Drag-and-drop zone: dashed border `2px dashed neutral-300`, 120–160px tall, "Drag and drop or click to browse" text. Preview: thumbnail + file name + size + remove button |
| Checkbox / Radio | 20px control size. Label on right. Group radios under a fieldset label |
| Toggle / Switch | Only for binary on/off settings. Not for forms |
| Password | Show/hide toggle icon inside input right |

**Field copy guidelines:**
- Labels are clear and concise (1–4 words)
- Placeholder text is optional; use for examples ("john@example.com"), never as the only label
- Helper text appears below input: 12px, `neutral-400`. For requirements, format hints, or error recovery
- Error messages appear below input: 12px, `red-500`, with a red warning icon

### 2. Review / Confirm

User reviews all entered information before final submission.

```
┌──────────────────────────────┐
│                              │
│  Review your order           │
│  ─────────────────────────── │
│                              │
│  ┌──────────────────────────┐│
│  │ Shipping Address    [Edit]│  ← Summary card. Read-only data display.
│  │                          ││     [Edit] link opens inline edit or
│  │  John Doe                ││     navigates back to that step.
│  │  123 Main Street         ││
│  │  San Francisco, CA 94105 ││
│  │  United States           ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │ Payment Method      [Edit]│
│  │                          ││
│  │  💳  Visa ending in 4242 ││
│  │  Expires 12/28           ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │ Items                [Edit]│
│  │                          ││
│  │  Pro Plan (Annual)  $299 ││
│  │  ─────────────────────── ││
│  │  Subtotal           $299 ││
│  │  Tax (8.5%)         $25  ││
│  │  Total              $324 ││
│  └──────────────────────────┘│
│                              │
│  ☐ I confirm the information │
│     above is correct         │
│                              │
│         [Submit Order]        │
│                              │
└──────────────────────────────┘
```

| Element | Specification |
|---|---|
| Summary card | White card with `1px solid neutral-200`, rounded-8px, padding 16–20px |
| Section label | 13px, weight 600, `neutral-700`, text-transform uppercase |
| Read-only data | 14–15px, `neutral-900`, displayed as plain text (not in disabled inputs) |
| Edit link | 13px, `accent-500`, right-aligned next to section label. Click navigates back to step or opens inline edit |
| Card spacing | 12–16px between summary cards |
| Confirm checkbox | Before submit button: "I confirm the information above is correct" |
| Submit button | Primary accent-500, full-width, 48–56px height, "Submit Order", "Confirm Booking", "Complete Registration" |

### 3. Payment / Checkout

A specialized review step with payment method collection and order summary.

```
┌──────────────────────────────────────────────────────────┐
│  Checkout                                                │
│                                                          │
│  ┌──────────────────────────┬──────────────────────────┐│
│  │                          │                          ││
│  │  Payment Method          │  Order Summary           ││
│  │                          │                          ││
│  │  [💳 Card] [🏦 Bank]     │  Pro Plan          $299 ││
│  │                          │  ────────────────────── ││
│  │  Card Number             │  Subtotal          $299 ││
│  │  ┌──────────────────────┐│  Discount (SUMMER)  -$30││
│  │  │ 4242 4242 4242 4242 ││  Tax               $23 ││
│  │  └──────────────────────┘│  ────────────────────── ││
│  │                          │  Total             $292 ││
│  │  Expiry         CVC      │                          ││
│  │  ┌──────┐  ┌──────────┐ │  Promo Code              ││
│  │  │ MM/YY│  │ 123      │ │  ┌──────────┐ [Apply]   ││
│  │  └──────┘  └──────────┘ │  │ SUMMER   │            ││
│  │                          │  └──────────┘            ││
│  │  Billing Address         │                          ││
│  │  ┌──────────────────────┐│                          ││
│  │  │ Same as shipping  ▾  ││                          ││
│  │  └──────────────────────┘│                          ││
│  │                          │                          ││
│  │  ┌──────────────────────┐│                          ││
│  │  │     Pay $292.00      ││  ← Full-width in panel  ││
│  │  └──────────────────────┘│                          ││
│  │                          │                          ││
│  │  🔒 Secured by Stripe    │                          ││
│  │                          │                          ││
│  └──────────────────────────┴──────────────────────────┘│
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Element | Specification |
|---|---|
| Layout | Two-column for desktop: left 60% (payment form), right 35–40% (order summary). Single column on mobile: order summary collapses to top |
| Payment method tabs | Toggle between card, bank, PayPal, etc. Visual icons + labels |
| Card input | Single full-width input with card brand icon on right. Auto-formats as user types |
| Order summary | Stuck to top of right panel. Line items + sub/total. Coupon input inline |
| Security indicator | Lock icon + "Secured by [provider]" text. Green or neutral-500. Builds trust |
| Pay button | Full-width accent-500, 52–56px height. Shows the exact amount: "Pay $292.00" |

### 4. Confirmation

The final screen after successful completion. Must provide closure and next steps.

```
┌──────────────────────────────┐
│                              │
│                              │
│          ✓ (animated)        │  ← Success checkmark. 64–80px,
│                              │     green-500, scale + fade-in
│                              │     animation (400ms, ease-out)
│                              │
│     Order Confirmed!         │  ← 24–28px, weight 700,
│                              │     neutral-900
│                              │
│  Your order #ORD-2024-0892   │  ← 14–16px, neutral-500,
│  has been placed. A receipt  │     reference/order number in
│  has been sent to             │     code font or bold
│  john@example.com.           │
│                              │
│  ┌──────────────────────────┐│
│  │  📧  Download Receipt    ││  ← Action card
│  └──────────────────────────┘│
│  ┌──────────────────────────┐│
│  │  📋  View Order Details  ││  ← Action card
│  └──────────────────────────┘│
│                              │
│  What's next?                │  ← Optional section
│  • Set up your profile       │
│  • Invite your team          │
│  • Explore the dashboard     │
│                              │
│     [Go to Dashboard →]       │  ← Primary CTA for post-completion
│                              │
│                              │
└──────────────────────────────┘
```

| Element | Specification |
|---|---|
| Success icon | Animated checkmark in green-500. 64–80px diameter. Animation: SVG stroke offset draw + scale pop. Duration 400ms |
| Heading | 24–28px, weight 700, "Order Confirmed!", "You're all set!", "Welcome aboard!" |
| Body text | 14–16px, `neutral-600`. Includes order/reference number prominently |
| Action cards | 1–3 cards for next actions: "Download Receipt", "View Order Details", "Set Up Profile" |
| Primary CTA | "Go to Dashboard", "Start Exploring", "View Project". accent-500, 44–52px height |
| Reference number | Bolded or code-font. Essential for customer support reference |
| Receipt | Download link or auto-download trigger |

---

## Mobile Considerations

Transactional flows on mobile must feel like a focused, full-screen modal — no distractions.

| Rule | Specification |
|---|---|
| Full-screen | Content fills entire viewport. No website navigation, no sidebar, no footer links (except legal) |
| Header | Minimal. Logo (centered or left), step indicator (compact), no menu |
| Touch targets | Minimum 48px height for all interactive elements. Buttons 52–56px |
| Keyboard awareness | Inputs must not be hidden by the virtual keyboard. Page scrolls to keep focused input visible. Sticky bottom bar stays above keyboard |
| Gesture | Swipe back should NOT navigate away (prevents accidental data loss). Instead, use explicit back buttons |
| Viewport | Use `viewport-fit=cover` and safe-area padding for notched phones |
| Horizontal scroll | Never. All content must fit within 100vw |
| Font size | Minimum 16px on inputs to prevent iOS zoom on focus |

### Mobile Step Indicator

On small screens, the full step indicator may be too wide.

```
Compact mode:

← Step 2 of 4 →        OR        ○○●○○
```

Use one of:
1. **Step counter text:** "Step 2 of 4" centered in header with back/forward arrows
2. **Dots only:** 4–5 dots, active dot filled accent-500
3. **Abbreviated labels:** "Account → **Details** → Payment" (only 3 visible)

---

## Loading States

### Step Transition Loading

When the user clicks "Continue" and the next step loads:

| Element | Behavior |
|---|---|
| Button | Immediately shows spinner + "Loading..." or spinner only. Button is disabled |
| Content | Current step remains visible (no flash of white) |
| Transition | After data is loaded, smooth fade or slide transition to next step (200–300ms ease-out) |
| Skeleton | While loading, the next step can show skeleton placeholders (grey rectangles approximating content shape) instead of blank white |

**DO NOT:**
- Reload the entire page (full-page refresh) — this breaks the flow
- Show a blank white screen between steps
- Allow the user to double-click the button (debounce the click)

### Submission Loading

When the user submits the final step:

| Element | Behavior |
|---|---|
| Submit button | Replaced with spinner + "Processing..." or "Submitting...". Button is disabled |
| Overlay | Optional: semi-transparent overlay on form to prevent interaction |
| Timeout handling | After 10–15 seconds, show "This is taking longer than usual. Please wait..." |
| Success | Transition to confirmation screen with success animation |
| Failure | Show error state. Keep the form data intact. Allow retry |

### Confirmation Loading

If post-submission processing is needed (e.g., generating receipt):

| Element | Behavior |
|---|---|
| Confirmation screen | Show immediately with "Finalizing your order..." and a subtle progress indicator |
| Data | Reference number appears when available. Receipt download triggers when ready |

---

## Error Handling

### Inline Validation

Validate fields as users complete them, not just on submit.

| Validation Timing | Specification |
|---|---|
| On blur | Validate when user leaves a field. Shows error immediately for invalid input |
| On change | Clear error state when user starts correcting. Don't re-validate on every keystroke (too aggressive) |
| On submit | Final validation of all fields. Prevents submission with errors. Scrolls to first error |
| Debounce | For remote validation (email taken, username available), debounce 300–500ms |

### Field-Level Errors

```
┌──────────────────────────────┐
│                              │
│  Email Address *             │
│  ┌──────────────────────────┐│
│  │ not-an-email        ⚠️   ││  ← Red-500 border, red icon inside right
│  └──────────────────────────┘│
│  ⚠️ Please enter a valid      │  ← 12–13px, red-500 text, red icon
│     email address            │
│                              │
└──────────────────────────────┘
```

| Element | Specification |
|---|---|
| Input border | `red-500` (1px or 2px) |
| Icon inside input | Red warning icon (circle-exclamation), 16–18px, right-aligned with 12px padding |
| Error message | Below input: 12–13px, `red-500`, weight 400. Starts with red warning icon. 1–2 lines max |
| Field label | Does NOT change color (stays neutral-700). Error is in the message, not the label |

### API / Server Errors

When the backend returns an error during submission:

```
┌──────────────────────────────┐
│ ⚠️  Something went wrong     │  ← Banner below progress indicator,
│    We couldn't process your  │     full-width of content area.
│    payment. Please try again │     red-50 background, red-500 border-left
│    or use a different card.  │     (4px), red-700 text. 48–56px height.
└──────────────────────────────┘
```

| Element | Specification |
|---|---|
| Position | Below progress bar, above content. Full width of content area |
| Style | `red-50` background, `red-500` left border (4px), `red-700` text |
| Icon | Red warning icon left-aligned |
| Content | Human-readable error message. No stack traces or raw API errors |
| Action | Retry button or suggested fix (e.g., "Try a different card") |
| Dismiss | Dismissible with X button if non-critical |

### Network Errors

| Error | Handling |
|---|---|
| No internet | Detect via `navigator.onLine`. Show "No internet connection. Please check your connection and try again." Provide retry button |
| Timeout | "The request timed out. Please try again." Retry button |
| 500 error | "Something went wrong on our end. We're working on it. Please try again in a few minutes." |

### Retry Mechanisms

| Scenario | Behavior |
|---|---|
| Form submission fails | Keep all entered data. Show error banner. User can click retry |
| Step loading fails | Show error in content area. "We couldn't load this step. [Try Again]" |
| Payment fails | Keep payment form. Show specific error (card declined, insufficient funds, etc.) |

---

## Anti-Patterns for Transactional

### 1. Distracting Chrome

**WRONG:** Sidebar, topbar, footer links, related content, marketing banners, or any non-essential UI during the flow.

**Why it's wrong:** Every extra element competes for attention and increases cognitive load. The user is trying to complete a task — anything else is friction.

**CORRECT:** Logo (top-left), progress indicator, help link (top-right), content area, legal footer. That's it.

### 2. Marketing Content During the Flow

**WRONG:** "Upgrade to Pro for faster checkout!", "You might also like...", cross-sell prompts, newsletter signup checkboxes, or testimonial quotes mid-flow.

**Why it's wrong:** The user has intent. Marketing during a transaction erodes trust and feels desperate. It also increases the likelihood of abandonment.

**CORRECT:** Zero marketing. The flow is sacred. Upsells happen before or after, not during.

### 3. Unexpected Navigation Away

**WRONG:** Clicking a logo that navigates to the homepage (losing all form data), back button that reloads the page, links that open in the same tab, or browser back that loses state.

**Why it's wrong:** Data loss is the worst outcome in a transactional flow. It destroys trust and rarely results in the user restarting the flow.

**CORRECT:**
- Logo opens homepage in a NEW tab
- Browser back preserves data and navigates to previous step
- Before leaving, show a confirmation dialog: "You have unsaved changes. Are you sure you want to leave?"
- Auto-save form data to localStorage or sessionStorage as the user types

### 4. Multi-Page Forms Without Progress Indicators

**WRONG:** A form split across multiple pages with no indication of which step the user is on, how many steps remain, or how to go back.

**Why it's wrong:** Users feel lost and anxious. They don't know how long the process will take, which increases abandonment.

**CORRECT:** Every multi-step flow has a clearly visible progress indicator showing completed, current, and upcoming steps.

### 5. Submit Buttons Without Loading States

**WRONG:** A submit button that gives no feedback when clicked. User clicks, nothing seems to happen, user clicks again (double-submission), or user clicks and navigates away thinking it didn't work.

**Why it's wrong:** Without feedback, users assume the action failed. This leads to double-submissions, duplicate charges, and frustration.

**CORRECT:**
- Button immediately transitions to loading state (spinner + disabled)
- Text changes: "Submit" → "Submitting..."
- Button is disabled during submission
- After 10+ seconds, show "Still processing..." message
- Edge case: double-click prevention via debounce

### 6. Multi-Column Forms

**WRONG:** Two or three columns of form fields in a transactional flow.

**Why it's wrong:** Multi-column forms are slower to scan and complete. Users often miss fields or fill them in the wrong order. Single-column forms are proven to be faster and more accurate.

**CORRECT:** Single-column layout. Exception: short, related fields (City + State + Zip on one line) or logical groupings (Expiry + CVC for credit cards).

### 7. Placeholder-Only Labels

**WRONG:** Inputs with no label, only a placeholder like "Enter your email" that disappears when the user starts typing.

**Why it's wrong:** Once the user types, the label is gone. They can't review what the field is for. This is especially bad for accessibility and error recovery.

**CORRECT:** Always place labels above inputs. Placeholders are optional examples, never the primary label.

---

## Brand Personality in Transactional

### Trusted / Secure (Fintech, E-commerce Checkout)

| Attribute | Specification |
|---|---|
| Color palette | Blues, dark navies, whites. Green for success states |
| Typography | Clean sans-serif: Inter, SF Pro. No decorative fonts |
| Tone | Serious, professional, reassuring |
| Surface treatment | White backgrounds, thin gray borders, lock icons, security badges |
| Key signals | SSL lock icon, "Secured by Stripe", PCI compliance badges, money-back guarantee mentions |
| Reference | Stripe Checkout, Shopify Checkout, Square Payment |

### Warm / Encouraging (Onboarding, Consumer Apps)

| Attribute | Specification |
|---|---|
| Color palette | Warm accents (coral, warm orange, soft purple). Lighter backgrounds |
| Typography | Friendly but readable. Slightly rounded fonts |
| Tone | Welcoming, encouraging, human |
| Surface treatment | Soft shadows, rounded cards, illustrations at each step, friendly micro-copy |
| Key signals | Progress compliments ("Almost there!"), friendly helper text, character mascots (optional) |
| Reference | Duolingo onboarding, Headspace signup, Canva onboarding |

### Minimal / Efficient (Developer Tools, Settings Forms)

| Attribute | Specification |
|---|---|
| Color palette | Neutrals, subtle blue accent. Dark mode often available |
| Typography | Inter or system fonts. Monospace for technical fields |
| Tone | Direct, concise, no fluff |
| Surface treatment | Flat, minimal borders. No illustrations. One field per row |
| Key signals | Keyboard shortcuts, markdown support in textareas, API key generation |
| Reference | Linear settings, Vercel project creation, GitHub repo creation |

---

## Real-World Reference Flows

### Stripe Checkout
- **Mode:** Trusted / secure payment
- **Signature traits:** Minimal chrome (Stripe logo only), centered form (max-w-md), card input with brand auto-detection, order summary right panel, lock icon + "Secured by Stripe", clean error handling inline, no distractions whatsoever
- **Key takeaway:** Reduce the interface to the absolute minimum. Every pixel builds trust. Security signals are prominent but not anxious.

### Linear Onboarding
- **Mode:** Minimal / efficient
- **Signature traits:** Keyboard-first navigation (Enter to continue, Esc to go back), minimal step indicator (small dots), no decorative elements, clean form fields, dark mode supported, auto-focus on first input of each step
- **Key takeaway:** Speed matters. Power users complete the flow in seconds. No hand-holding. Clear and fast.

### Airbnb Booking
- **Mode:** Warm / visual
- **Signature traits:** Visual step indicator with icons, large property image persists in side panel, price breakdown is transparent and reassuring, date picker is custom and visual, "You won't be charged yet" messaging to reduce anxiety
- **Key takeaway:** Reduce anxiety at every step. Show what the user is booking. Be transparent about pricing. Warm, encouraging tone.
