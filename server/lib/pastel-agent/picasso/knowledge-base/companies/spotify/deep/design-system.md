# Spotify Design System — Deep Reference

## Core Design Tokens

### Color Palette

#### Background System (Dark Canvas)

| Token | Value | Usage |
|-------|-------|-------|
| `color-bg-base` | `#121212` | Primary app background |
| `color-bg-elevated` | `#181818` | Cards, sidebar, now playing background |
| `color-bg-highlight` | `#282828` | Active/hover states, input fields, active cards |
| `color-bg-pressed` | `#333333` | Pressed states, buttons on dark surfaces |
| `color-bg-overlay` | `rgba(0,0,0,0.7)` | Modal backdrops, overlay panels |

#### Text on Dark

| Token | Value | Usage |
|-------|-------|-------|
| `color-text-primary` | `#FFFFFF` | Headings, active navigation, primary text |
| `color-text-secondary` | `#B3B3B3` | Subtitles, metadata, secondary text |
| `color-text-subdued` | `#727272` | Disabled text, tertiary labels |

#### Brand Accent (The Green)

| Token | Value | Usage |
|-------|-------|-------|
| `color-accent` | `#1DB954` | Primary buttons, progress indicator, active states, links |
| `color-accent-hover` | `#1ED760` | Hover state for accent elements |
| `color-accent-pressed` | `#1AA34A` | Pressed state for accent buttons |

#### Semantic

| Token | Value | Usage |
|-------|-------|-------|
| `color-success` | `#1DB954` | Success states (same as accent) |
| `color-error` | `#F15E6C` | Error states, destructive actions |
| `color-warning` | `#FFA42B` | Warning indicators |
| `color-info` | `#509BF5` | Information, links (alternative to green) |
| `color-heart` | `#1DB954` | Favorite/like active state (green) |
| `color-heart-inactive` | `#B3B3B3` | Favorite/like inactive state |

#### Content Categories (Search/Browse Tiles)

| Category | Gradient/Color |
|----------|---------------|
| Pop | `#E13300 → #E8115B` |
| Hip-Hop | `#BA5D07 → #DC148C` |
| Rock | `#006450 → #1E3264` |
| Electronic | `#8400E7 → #DC148C` |
| R&B | `#DC148C → #8400E7` |
| Podcasts | `#006450 → #1DB954` |
| Mood | `#1E3264 → #A5672F` |
| Focus | `#503750 → #1E3264` |

### Gradient System (Marketing & Covers)

Spotify uses a custom gradient language for playlist covers, genre tiles, and marketing:
- Flowing, organic color blends (not linear/radial)
- Multiple color stops with smooth transitions
- Often incorporates green as one stop
- Duotone: Photography + color overlay (single or dual color)
- Used on playlist covers, not in the core UI (which stays monochrome)

---

## Typography System

### Font Stack

```css
font-family: 'Circular', 'Circular Std', -apple-system,
             BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Type Scale

| Level | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-6xl` | 96px | 104px | Bold (800) | Hero marketing, Wrapped |
| `text-5xl` | 64px | 72px | Bold (800) | Page heroes, major headings |
| `text-4xl` | 48px | 56px | Bold (700) | Section heroes |
| `text-3xl` | 32px | 40px | Bold (700) | Page headings |
| `text-2xl` | 24px | 32px | Bold (700) | Section titles, playlist headers |
| `text-xl` | 20px | 28px | Bold (700) | Card titles, prominent labels |
| `text-lg` | 18px | 26px | Book (400) | Large body, artist names |
| `text-base` | 16px | 24px | Book (400) | Body text, track names, descriptions |
| `text-sm` | 14px | 20px | Book (400) | Artist names (secondary), metadata |
| `text-xs` | 12px | 16px | Book (400) | Captions, timestamps, labels |
| `text-2xs` | 10px | 14px | Bold (700) | All-caps CTAs, overlines |

### Typography Rules

1. **Bold for impact** — Use Bold (700-800) for any heading. Spotify typography is CONFIDENT.
2. **All-caps for buttons** — Primary action buttons use uppercase, Bold, 10-12px, letter-spacing 1-2px. This is a defining Spotify characteristic.
3. **Book for body** — Content text uses Book (400). Clean, legible on dark backgrounds.
4. **White text on dark** — Always. No dark text on light backgrounds. No exceptions.
5. **Letter-spacing** — Headings: -0.5px to -1px. Buttons: +1px to +2px. Body: 0.
6. **One typeface** — Circular only. Every size, every weight. Consistency above all.

---

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Icon-text inline gap, tight spacing |
| `space-2` | 8px | Small gaps, icon padding |
| `space-3` | 12px | List item gaps, compact sections |
| `space-4` | 16px | Standard padding, card gaps, grid gaps |
| `space-5` | 20px | Medium section spacing |
| `space-6` | 24px | Section padding, content separation |
| `space-8` | 32px | Section headers, major spacing |
| `space-10` | 40px | Large section breaks |
| `space-12` | 48px | Page-level section padding |
| `space-16` | 64px | Hero section padding |

### Spacing Rules

- **Browse screens**: Generous. 16px padding, 16px grid gaps for album art. Content is visual.
- **Now Playing**: Tighter around controls, comfortable around album art.
- **Lists**: 12-16px between items. Compact but not cramped.
- **Section headers**: 32px above, 16px below. Clear hierarchy through spacing.

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Small buttons, tags, indicators |
| `radius-md` | 8px | Input fields, search bars, small cards |
| `radius-lg` | 12px | Browse tiles, genre cards, album art in some contexts |
| `radius-full` | 9999px | Pills, profile avatars, shuffle/enhance buttons |

### Radius Rules

- Album/playlist art: square with subtle rounding (2-4px depending on context) or sharp. The square format is iconic.
- Cards and tiles: 8-12px
- Buttons: 9999px (pill-shaped) — signature Spotify
- Search bar: 8px
- Modals: 8px

---

## Shadow System

Shadows on dark backgrounds are different — they're about elevation, not visibility. Instead of dark shadows, Spotify uses **lighter surface colors** to indicate elevation.

| Token | Usage | Color |
|-------|-------|-------|
| `shadow-card` | Subtle depth on cards | Lighter background (`#181818` on `#121212`) |
| `shadow-elevated` | Modals, popovers | `rgba(0,0,0,0.5)` with `#282828` surface |
| `shadow-button` | Green buttons | `0 2px 8px rgba(29,185,84,0.4)` green glow |

### Elevation System (Not Traditional Shadows)

Spotify doesn't use traditional drop shadows. Instead, surfaces get lighter as they get closer:
- Base: `#121212`
- Card: `#181818`
- Active/Hover: `#282828`
- Modal: `#282828` with overlay

This is more subtle and appropriate for dark mode than traditional shadows.

---

## Component Patterns

### Now Playing Bar (Persistent Mini Player)

```
+--------------------------------------------------+
| [Album 56px] Track Name — Artist       [❤] [▶⏸] |
|              [===== Progress ============]         |
+--------------------------------------------------+
```

**Key specs:**
- Height: 56px (mobile), 72px (tablet)
- Background: `#181818` with subtle top border (1px, `#282828`)
- Album art: 48x48px (mobile), 56x56px (tablet), square, 4px radius
- Track name: 14px Book, `#FFFFFF`, single line, ellipsis
- Artist: 12px Book, `#B3B3B3`, linked (tappable)
- Controls: Heart (16px icon) + Play/Pause (24px icon)
- Progress bar: 2px height, `#535353` track, `#FFFFFF` thumb, `#1DB954` fill behind thumb
- Tap the bar → expands to full Now Playing view
- Swipe down on full Now Playing → collapses back to bar

### Now Playing (Full Screen)

```
+--------------------------------------------------+
| [↓ Collapse]                         [⋯ More]     |
+--------------------------------------------------+
|                                                  |
|              +--------------+                    |
|              |              |                    |
|              |  ALBUM ART   |                    |
|              |  (full width,|                    |
|              |   square)    |                    |
|              |              |                    |
|              +--------------+                    |
|                                                  |
|  Track Name                          [❤ Green]  |
|  Artist Name                                     |
|                                                  |
|  [====●============== Progress ==============]    |
|    1:23                          3:45           |
|                                                  |
|  [🔀]  [⏮]  [▶⏸ 64px]  [⏭]  [🔁]              |
|                                                  |
|  [Devices]                   [Queue] [Share]      |
|                                                  |
+--------------------------------------------------+
```

**Key specs:**
- Album art: Full-width (minus 32px padding each side), square, 4px radius
- Track name: 24px Bold, `#FFFFFF`
- Artist: 14px Book, `#B3B3B3`, linked
- Progress bar: 4px height, `#535353` track, `#1DB954` past, `#FFFFFF` thumb (12px circle), shows on hover/touch
- Timestamps: 12px Book, `#B3B3B3`
- Controls: Shuffle, Previous, Play/Pause (64px circle, green, white play icon), Next, Repeat
- Bottom row: Connect to device, Queue, Share — 14px icons
- Background: Gradient that samples dominant colors from album art. Creates immersive, album-specific atmosphere.
- Canvas: If available, replaces static album art with a short looping video

### Playlist Card (Grid View)

```
+---------------------+
|                     |
|                     |
|    COVER IMAGE      |
|    (square, 1:1)    |
|    (4px radius)     |
|                     |
|                     |
+---------------------+
| Playlist Name       |
| Description/Artist  |
+---------------------+
```

**Key specs:**
- Aspect ratio: 1:1 (always square)
- Border-radius: 4px (subtle, nearly sharp — album art should look like physical media)
- Title: 16px Bold, `#FFFFFF`, 2 lines max, ellipsis overflow
- Description: 14px Book, `#B3B3B3`, 1 line, ellipsis
- Width: Responsive, typically 140-200px
- Hover (desktop): Card scales to 1.02, shadow appears
- Tap (mobile): Navigates to playlist/album detail

### Playlist/Album Header (Detail View)

```
+--------------------------------------------------+
|                                                  |
|  +------+                                        |
|  | COVER|  PLAYLIST                              |
|  |      |  Playlist Name (massive, 48-96px Bold) |
|  | 232px|  Description                           |
|  |      |  • Spotify • 2,450,123 saves            |
|  |      |  • 50 songs • 3 hr 15 min              |
|  +------+                                        |
|                                                  |
+--------------------------------------------------+
|  [▶ Play Green]  [🔀 Shuffle]  [❤ Heart]  [⋯]   |
+--------------------------------------------------+
|  #  TITLE                          ARTIST   TIME  |
+--------------------------------------------------+
|  1  Track One              Artist Name     3:45  |
|     [==== Progress (if playing) ========]         |
+--------------------------------------------------+
|  2  Track Two              Artist Name     4:12  |
+--------------------------------------------------+
|  3  Track Three            Artist Name     2:58  |
+--------------------------------------------------+
```

**Key specs:**
- Cover image: 232x232px, shadow, 4px radius
- Type label: 12px Bold, all-caps, `#FFFFFF` ("PLAYLIST" or "ALBUM")
- Name: 48-96px Bold (responsive), `#FFFFFF`, can be massive for short names
- Description: 14px Book, `#B3B3B3`
- Metadata: 14px Book, `#B3B3B3`, dot-separated
- Action row: Play (green pill), Shuffle, Heart (outline), More (•••)
- Track list: Numbered, with currently playing track highlighted in green text
- Playing indicator: Green speaker icon + green text for current track
- Explicit tags: Small "E" badge on explicit tracks

### Search Bar + Browse

**Search Input:**
```
+--------------------------------------------------+
|  🔍  What do you want to listen to?               |
+--------------------------------------------------+
```
- Height: 48px
- Background: `#282828`
- Border-radius: 8px
- Placeholder: 16px Book, `#B3B3B3`
- Focus: Green border highlight (desktop)
- Clear button (X) appears when text is entered

**Browse All (Genre Tiles):**
```
+--------------+  +--------------+  +--------------+
|              |  |              |  |              |
|              |  |              |  |              |
|   GRADIENT   |  |   GRADIENT   |  |   GRADIENT   |
|              |  |              |  |              |
|              |  |              |  |              |
|   Podcasts   |  |     Rock     |  |     Pop      |
+--------------+  +--------------+  +--------------+
```
- Large tiles, 2 column grid on mobile, 4+ on desktop
- Each tile: unique gradient background, 12px radius, ~150px height
- Genre/mood name: 20px Bold, `#FFFFFF`
- Often paired with relevant emoji or simple icon

### Library / Your Library

```
+--------------------------------------------------+
|  Your Library                                     |
|  [Playlists] [Albums] [Artists] [Podcasts & Shows] |
+--------------------------------------------------+
|  [🔍 Search]                        [Recently ▼]  |
+--------------------------------------------------+
|  +--+                                             |
|  |  |  Playlist Name                              |
|  +--+  Playlist • 50 songs                        |
|  +--+                                             |
|  |  |  Album Name                                 |
|  +--+  Album • Artist Name                        |
|  +--+                                             |
|  |  |  Liked Songs                                |
|  +--+  Playlist • 342 songs                        |
|                                                  |
+--------------------------------------------------+
```

**Key specs:**
- Filter tabs: Horizontal scrollable pills (Playlists, Albums, Artists, Podcasts)
- Sort/Filter: Dropdown for sort order (Recently played, Recently added, Alphabetical, Creator)
- List items: Album art thumbnail (56x56px), title (16px Bold), subtitle (14px Book)
- Grid/list toggle: Icon button to switch between list and grid view
- Grid view: 3 columns of album art squares

### Navigation

**Mobile (Bottom Tabbar):**
```
+--------------------------------------------------+
|  🏠 Home    🔍 Search    📚 Library    ⬆ Premium |
+--------------------------------------------------+
```
- 3-4 tabs: Home, Search, Library, Premium (free tier)
- Active tab: white icon + white label
- Inactive: gray icon + gray label
- Labels: 10px Book below icon
- Background: `#121212`

**Desktop (Left Sidebar):**
```
+-----------------------------------+------------------+
| [Spotify Logo]                    |                  |
|                                   |                  |
| 🏠 Home                           |   Content Area   |
| 🔍 Search                         |                  |
| 📚 Your Library                   |                  |
|                                   |                  |
| +-----------------------------+   |                  |
| | Create Playlist             |   |                  |
| | Liked Songs                 |   |                  |
| | Your Episodes               |   |                  |
| +-----------------------------+   |                  |
|                                   |                  |
| PLAYLISTS                         |                  |
| Discover Weekly                   |                  |
| Release Radar                     |                  |
| My Playlist #1                    |                  |
| ...                              |                  |
+-----------------------------------+------------------+
|  [Track Name — Artist]     [▶]   |                  |
+-----------------------------------+------------------+
```
- Fixed left sidebar: 240px wide
- Top: Navigation links with icons
- Middle: Library with playlist list (scrollable)
- Bottom: Persistent player (same behavior as mobile)

---

## Buttons & CTAs

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| Primary (Green) | `#1DB954` | `#FFFFFF`, Bold, all-caps, 12px, +1px letter-spacing | None | Main CTAs: Play, Save, Follow |
| Primary Large | `#1DB954` | `#FFFFFF`, Bold, all-caps, 14px, +1.5px letter-spacing | None | Hero CTAs, signup |
| Secondary | `rgba(255,255,255,0.1)` | `#FFFFFF`, Bold, 12px | `1px solid #727272` | Shuffle, Share, secondary actions |
| Ghost | Transparent | `#B3B3B3` | None | Less important actions |
| Pill (Green) | `#1DB954` | `#000000` (yes, black on green) | None | Premium upsells, special CTAs |

### Button Specs
- All buttons: 9999px border-radius (pill-shaped). This is a defining Spotify trait.
- Height: 32px (small), 40px (medium), 48px (large), 56px (extra-large)
- Uppercase text: Bold, +1-2px letter-spacing
- Hover: Scale 1.02-1.04
- Pressed: Scale 0.98
- Green primary + all-caps text = the Spotify CTA signature

---

## Motion & Animation

### Principles

Spotify motion is **smooth, confident, and responsive**. It feels premium — like high-end hardware.

### Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `motion-fast` | 150ms | Micro-interactions, button states |
| `motion-normal` | 250ms | Transitions, card interactions |
| `motion-slow` | 350ms | Page transitions, panel reveals |
| `motion-expand` | 400ms | Player expand/collapse |

### Easing

- **Default**: `cubic-bezier(0.4, 0, 0.2, 1)` — smooth, standard
- **Accelerate**: `cubic-bezier(0.4, 0, 1, 1)` — for elements exiting
- **Decelerate**: `cubic-bezier(0, 0, 0.2, 1)` — for elements entering

### Key Animations

1. **Player expand**: Tap mini player → album art lifts and expands into full Now Playing view. Smooth 400ms, decelerating ease. Reversible (swipe down).
2. **Album art hover (desktop)**: Subtle scale(1.03) + green play button fades in center. 250ms.
3. **Playlist scroll**: Header collapses as you scroll — cover image shrinks, title resizes.
4. **Track change**: Cross-fade album art (300ms). Canvas video loops transition smoothly.
5. **Heart/like**: Green fill animates in (200ms). Quick pulse scale.
6. **Queue panel**: Slides up from bottom with decelerating ease (350ms).
7. **Search type-ahead**: Results fade in with subtle stagger (50ms per item).
8. **Progress bar**: Smooth, real-time update. Thumb (12px circle) appears on hover.

---

## Accessibility

### Standards
- WCAG 2.1 AA
- Keyboard navigation for all interactive elements
- Focus indicators: White ring on dark backgrounds

### Color Contrast (Dark Background Challenge)
- White (#FFFFFF) on `#121212`: 18.5:1 AAA
- Gray (#B3B3B3) on `#121212`: 9.3:1 AAA
- Green (#1DB954) on `#121212`: 9.1:1 AAA
- Subdued (#727272) on `#121212`: 4.7:1 AA (meets threshold)
- White on green button: 3.8:1 (does NOT meet AA for body text — but green buttons use all-caps Bold, which improves legibility. Specifically exempted as "large text" or "UI component" in practice)

### Screen Reader
- All album art has alt text: "{Album Name} by {Artist}"
- Play/Pause state announced clearly
- Progress announced: "2 minutes 30 seconds of 4 minutes 15 seconds"
- Track list: Row numbers announced, playing state indicated
- Lyrics button: "Show lyrics for {Track Name}"

---

## Grid System

### Breakpoints

| Name | Width | Layout |
|------|-------|--------|
| Mobile | 0-767px | Single column, full-width cards |
| Tablet | 768-1023px | 2-3 column card grids |
| Desktop | 1024-1439px | 4-6 column card grids + sidebar |
| Large | 1440px+ | Max-width 1952px, 7+ columns |

### Content Grid
- Album art cards: Auto-fill with min-width 160px
- Gap: 16px for grids, 16px page padding
- Content region (desktop): Viewport minus 240px sidebar

---

## Icon System

- Custom icon set (streamlined, modern)
- Style: 1.5-2px stroke, minimal, clean
- Default size: 24px for UI, 16px for inline
- Colors: `#B3B3B3` default, `#FFFFFF` active, `#1DB954` accent
- Icons never replace text on primary navigation
- Play button: Iconic triangle in circle — the most important icon in the system

---

## States & Feedback

### Loading States
- Skeleton screens: Gray rectangles (`#282828`) with shimmer animation
- Track loading: Spinner in mini player area
- Canvas loading: Album art displays until Canvas video is ready
- Never show a blank screen — always show skeleton or placeholder

### Empty States
- Dark background with centered illustration/icon
- Friendly heading: "No playlists yet" / "Search for your favorite artists"
- CTA button to take action
- Genre browse suggestions to inspire discovery

### Error States
- Centered error message with icon
- "Something went wrong. Try again?" — friendly, light tone
- Retry button (green pill)
- Offline: "You're offline. Check your connection." with downloaded content still accessible

### Playing State
- Green text for currently playing track
- Green speaker/equalizer icon next to track
- Pulsing equalizer animation on the icon
- Green progress bar in Now Playing view
