# Spotify — Do This, Not That

## Darkness & Background

### DO
- Use dark backgrounds as the ONLY mode — #121212 base, #181818 elevated, #282828 active
- Let the dark canvas make album art and content pop
- Use subtle surface elevation (lighter grays) instead of traditional shadows
- Keep the UI monochrome — let content provide ALL color
- Design for nighttime use (when most music listening happens)
- Test all content against dark backgrounds for legibility
- Use true black (#000000) sparingly for maximum contrast moments

### DON'T
- Create a light mode option (this is NOT part of the Spotify brand)
- Use white or light backgrounds for any primary surface
- Use heavy drop shadows on dark backgrounds (use elevation via lighter surfaces)
- Color UI chrome beyond green and grayscale
- Design assuming users are in a bright environment
- Use dark gray text on dark backgrounds (insufficient contrast)
- Make the interface feel heavy or light-deprived (dark should feel premium, not depressing)

---

## Album Art & Content

### DO
- Make album/playlist art the primary visual on every screen
- Use square format (1:1) for album and playlist covers
- Apply minimal border-radius (2-4px) — album art should look like physical media
- Let album art determine the visual color palette for Now Playing backgrounds
- Support Canvas video loops as an enhancement to static album art
- Show album art thumbnails in track lists (40x40px)
- Use album art as the hero in playlist/album headers (232px on desktop)
- Never crop or distort album art — maintain original aspect ratio

### DON'T
- Create UI chrome that competes with or covers album art
- Use circular album art for music (reserved for podcasts and artist profiles)
- Apply heavy border-radius to album art (12px+ makes it feel like app UI, not music)
- Use placeholder or generic art without artist branding
- Allow the UI to be more colorful than the content
- Crop album art to fill non-square containers
- Show the app without any album art visible (even lists have thumbnails)
- Use album art as background (use sampled color gradients instead)

---

## Typography

### DO
- Use Circular for everything — one typeface, many weights
- Use Bold (700-800) for all headings — typography should be CONFIDENT
- Use Book (400) for body text, artist names, and metadata
- Use all-caps for button text (Bold, 10-14px, +1-2px letter-spacing) — this is Spotify's signature
- Scale heading size dramatically (28-96px) based on content length
- Use negative letter-spacing on large headings (-0.5px to -1.5px)
- Use white (#FFFFFF) for all primary text on dark backgrounds
- Use gray (#B3B3B3) for secondary text consistently

### DON'T
- Use multiple type families — Circular is the only font
- Use thin/light font weights (hard to read on dark backgrounds)
- Write headings in title case or sentence case — use what reads best (often mixed)
- Use all-caps for body text or headings (reserved for buttons/labels only)
- Use text shadows or outlines for legibility (solid white on dark is sufficient)
- Compress letter-spacing on body text (0 is fine for readability)
- Use any typeface that feels delicate or traditional (Circular is modern and geometric)
- Make headings the same size regardless of text length (responsive typography is key)

---

## Buttons & CTAs

### DO
- Make all buttons pill-shaped (9999px border-radius)
- Use green (#1DB954) for primary buttons with black or white text
- Use uppercase, Bold text on buttons (+1-2px letter-spacing)
- Apply hover scale(1.03) for interactive feedback on desktop
- Use white outlined pills for secondary actions
- Make the Play button green and prominent — it's the most important action
- Show button height at 48px for main CTAs, 32-40px for smaller contexts
- Place a green button near the hero area (Play, Follow, Save)

### DON'T
- Use square or sharp-cornered buttons (pill-shaped is the Spotify signature)
- Use sentence case or lowercase for button text (always all-caps)
- Make buttons any color other than green or white/transparent
- Create more than two button styles on a single screen
- Use green for destructive or secondary actions (green = primary/go/play)
- Make buttons without any border-radius
- Use standard font-weight for button text (Bold is more legible at small all-caps sizes)
- Place irrelevant buttons in prime real estate (the Play button owns the hero spot)

---

## Player & Controls

### DO
- Keep the Now Playing bar persistent at the bottom — it should follow users everywhere
- Make the Play/Pause button the largest control (64px circle, green)
- Show album art + track name + artist in the mini player
- Use green (#1DB954) for the progress bar past the thumb
- Make the progress bar interactive (scrub, tap to seek)
- Support swipe-down to collapse the full player
- Animate the player expand/collapse smoothly (400ms)
- Show device picker and queue as accessible secondary actions

### DON'T
- Hide the player or make it accessible only via navigation
- Make all control buttons the same size (Play/Pause is primary, should be larger)
- Use a static progress bar that can't be scrubbed
- Make the mini player too tall (56px mobile, 72px tablet max)
- Require multiple taps to get to playback controls
- Use non-green colors for the progress indicator
- Make the player feel disconnected from the rest of the app
- Hide what's currently playing when browsing other content

---

## Color & Accent

### DO
- Use green (#1DB954) as the ONLY accent color in the UI
- Apply green to: Play buttons, progress bar, active states, links, heart/like (active), brand logo
- Use grayscale for all other UI elements (text, icons, surfaces)
- Let album art introduce other colors into the experience
- Use green sparingly — a little green on dark goes a long way
- Apply a green hover state (#1ED760) for interactive accent elements
- Keep the accent consistent across ALL platforms (mobile, desktop, web, TV)

### DON'T
- Introduce additional accent colors for different features or sections
- Use green for decorative purposes (only interactive elements)
- Apply green gradients to UI backgrounds (gradients are for marketing and covers only)
- Use different greens in different contexts (one green: #1DB954, one hover: #1ED760)
- Make the accent compete with album art for attention
- Use green text for body copy (only for interactive/active states)
- Color-code sections or features (everything is grayscale + green + content color)

---

## Navigation & Layout

### DO
- Use a bottom tabbar on mobile (Home, Search, Library, Premium)
- Use a left sidebar on desktop (240px, persistent)
- Keep navigation minimal — 3-4 primary destinations
- Show the persistent player across all views
- Use horizontal scrolling rows for content discovery categories
- Allow grid/list view toggle in Library
- Keep content front and center — navigation should be subtle
- Highlight the active tab with white text/icon

### DON'T
- Overload navigation with more than 5 primary destinations
- Use hamburger menus to hide navigation (tabbar is more accessible)
- Make navigation compete visually with content
- Use colored backgrounds for navigation elements (dark only)
- Create nested navigation structures that disorient users
- Hide the player in any view
- Use different navigation patterns for the same app on different platforms
- Make the user hunt for navigation — it should be immediately visible

---

## Personalization & Discovery

### DO
- Show time-aware greetings on Home ("Good morning", "Good evening")
- Curate recommendations based on listening history, time of day, and context
- Display recently played content prominently for quick resumption
- Use algorithmic playlist names that feel personal ("Made for [Name]")
- Show "Discover Weekly" and "Release Radar" on Home every week
- Provide context for recommendations ("Because you listened to...")
- Make the Home screen different for every user

### DON'T
- Show the same Home screen to all users (personalization is core value prop)
- Use generic, unpersonalized playlist names ("Popular Music")
- Ignore time-of-day context in recommendations
- Bury personalized content below generic promotional content
- Make algorithmic playlists feel like generic playlists
- Show recommendations without context or explanation
- Overload Home with content that isn't personalized

---

## Motion & Animation

### DO
- Animate the player expand/collapse (400ms, decelerating ease)
- Apply subtle hover scale(1.02-1.03) on album art cards (desktop)
- Fade in Canvas video loops smoothly (300ms cross-fade)
- Cross-fade between tracks in Now Playing (300ms)
- Use smooth, premium-feeling transitions between views
- Animate the green heart fill with a quick pulse (200ms)
- Collapse headers smoothly as the user scrolls down track lists
- Use the standard easing curve: cubic-bezier(0.4, 0, 0.2, 1)

### DON'T
- Use bouncy or playful animations (Spotify is premium and smooth, not playful)
- Animate excessively for decorative purposes (motion should be functional)
- Make transitions longer than 400ms (music control needs to feel responsive)
- Scroll-jack or override native scroll behavior
- Use spring-based or overshoot animations (too playful for the premium feel)
- Flash or blink elements for attention
- Auto-play Canvas with abrupt transitions (cross-fade is smoother)

---

## Podcasts & Non-Music Content

### DO
- Use circular art for podcast covers (differentiates from square music covers)
- Show progress indicators on podcast episodes (bar showing listening progress)
- Display "New episode" badges prominently
- Use "Episodes" label instead of "Songs" for podcast track lists
- Show remaining time alongside total duration for in-progress episodes
- Allow variable playback speed (0.5x - 3x) with easy access
- Show episode descriptions and show notes clearly

### DON'T
- Use square covers for podcasts (circular is the podcast convention on Spotify)
- Confuse podcast navigation with music navigation
- Hide playback speed controls (speed control is essential for podcast listening)
- Show "Songs" label for podcast episodes
- Treat podcasts as a secondary feature (they're a primary content type)
- Use the same treatment for music playlists and podcast shows
- Forget that podcast listening behavior differs from music (more seeking, speed control)

---

## Wrapped & Data Visualization

### DO
- Use bold, vibrant duotone and gradient treatments
- Animate statistics with count-up effects
- Create shareable card designs for social media
- Use the data as a narrative — tell a story about the user's year in music
- Apply custom typography treatments (oversized, creative layouts)
- Match visual energy to the user's listening patterns
- Make it feel like an event, not a report

### DON'T
- Show data as plain tables or charts (Wrapped is storytelling, not analytics)
- Use the standard app typography (Wrapped has its own visual language)
- Design Wrapped cards that don't work as social media shares
- Present stats without narrative context
- Use dark, muted, or corporate-style data visualizations
- Ignore Wrapped as a brand moment (it's one of the biggest annual design projects)

---

## What Makes Something Feel "Non-Spotify"

These are the telltale signals that a design has drifted from the Spotify brand:

1. **Light mode backgrounds** — the single biggest violation. Spotify = dark.
2. **Multiple accent colors** — only one accent: green (#1DB954)
3. **Square or sharp buttons** — Spotify buttons are pill-shaped (9999px radius)
4. **Sentence case buttons** — Spotify buttons use all-caps Bold prominently
5. **No persistent player** — the player must be accessible from every view
6. **Low-contrast text** — all primary text must be white on dark backgrounds
7. **Missing album art** — every screen should feature album art somewhere
8. **Non-Circular typography** — only one typeface is used
9. **Colored UI chrome** — the UI is monochrome; color comes from content
10. **Generic/unpersonalized content** — algorithms should drive what every user sees
11. **Slow or linear animations** — Spotify motion is premium and smooth
12. **Blue accent instead of green** — green IS Spotify. Other colors signal other brands.
13. **Heavy shadows** — on dark backgrounds, use lighter surfaces for elevation
14. **Standard button shapes** — pill-shaped buttons are one of Spotify's most consistent signatures
