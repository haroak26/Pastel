# Spotify Case Studies — Deep Reference

## Screen 1: Home

### Purpose
The discovery engine. Home is a personalized feed of recommendations, recently played content, and algorithmically curated playlists. It must feel like it knows you — a mix of familiar favorites and new discoveries.

### Layout (Mobile)

```
+--------------------------------------------------+
|  Good evening                           [🔔] [⚙️] |
+--------------------------------------------------+
|                                                  |
|  +-------------------+  +-------------------+     |
|  |  [Album Art]      |  |  [Album Art]      |     |
|  |  Liked Songs      |  |  Discover Weekly   |     |
|  |  342 songs        |  |  Made for you      |     |
|  +-------------------+  +-------------------+     |
|  +-------------------+  +-------------------+     |
|  |  [Album Art]      |  |  [Album Art]      |     |
|  |  Daily Mix 1      |  |  Release Radar     |     |
|  |  Artist names...  |  |  New for you       |     |
|  +-------------------+  +-------------------+     |
|                                                  |
|  Recently played                                  |
|  +-----+  +-----+  +-----+  +-----+  +-----+     |
|  | ART |  | ART |  | ART |  | ART |  | ART |     |
|  |     |  |     |  |     |  |     |  |     |     |
|  |Name |  |Name |  |Name |  |Name |  |Name |     |
|  +-----+  +-----+  +-----+  +-----+  +-----+     |
|                                                  |
|  Made for you                                     |
|  +-------------------+  +-------------------+     |
|  |  [Cover Art]      |  |  [Cover Art]      |     |
|  |  Daily Mix 1       |  |  Daily Mix 2       |     |
|  |  Artist, Artist... |  |  Artist, Artist... |     |
|  +-------------------+  +-------------------+     |
|                                                  |
|  Your heavy rotation                              |
|  +-------------------+  +-------------------+     |
|  |  [Cover Art]      |  |  [Cover Art]      |     |
|  |  Album Name        |  |  Album Name        |     |
|  |  Artist Name       |  |  Artist Name       |     |
|  +-------------------+  +-------------------+     |
|                                                  |
|  Shows to catch up on (Podcasts)                  |
|  +-----+  +-----+  +-----+  +-----+               |
|  | ART |  | ART |  | ART |  | ART |               |
|  |     |  |     |  |     |  |     |               |
|  |Name |  |Name |  |Name |  |Name |               |
|  | Prog|  | Prog|  | Prog|  | Prog|               |
|  +-----+  +-----+  +-----+  +-----+               |
|                                                  |
+--------------------------------------------------+
```

### Section Structure

The home feed is organized into horizontal scrollable rows:

**Top Bar**
- Greeting: "Good morning" / "Good afternoon" / "Good evening" (time-aware)
- Bell icon: Notifications (new releases, concert alerts, friend activity)
- Settings gear
- Profile avatar (on some versions)
- Background: `#121212`, text `#FFFFFF`, 56px height

**Recently Played (Mixed Content Row)**
- Horizontal scroll of recently played albums, playlists, and podcasts
- Card: Album art (square), title below, subtitle if applicable
- Progress bar on podcast episodes ("23 min left")
- Ordered by recency — most recent on the left
- This row is the user's "quick resume" for anything they were listening to

**Made For You (Algorithmic Playlists)**
- "Discover Weekly" — updates every Monday. Custom cover art.
- "Release Radar" — new releases from followed/liked artists. Updates every Friday.
- "Daily Mix 1-6" — genre-based blends of familiar + new music
- "Your Time Capsule" / "Your Summer Rewind" — seasonal, retrospective
- Cards are larger (200px+ wide) with custom algorithmic covers

**Shows to Catch Up On (Podcasts)**
- Circular art (podcasts often use circular covers on Spotify)
- Progress bar overlay showing episodes remaining or listening progress
- "New episode" badge on shows with unplayed episodes
- Tapping opens the podcast page scrolled to the latest episode

### Scroll Behavior
- Header stays fixed
- Content scrolls vertically
- Horizontal scroll within each section row
- "Show all" link at the end of each row that navigates to a full category view

### Interaction Flow
1. User opens app → sees personalized greeting + recently played
2. Scrolls to browse algorithmic playlists, podcasts, and recommendations
3. Taps a card → navigates to playlist/album/podcast detail
4. Taps play on a card → starts playing immediately
5. Pull down to refresh (loads updated recommendations)
6. Taps notification bell → views new releases and alerts

### Personalization Logic
- Home is different for every user. Every. Single. Time.
- Content is ranked by listening history, time of day, day of week, and current behavior
- Morning: calming playlists, news podcasts
- Afternoon: upbeat, focus music
- Evening: dinner, chill, party
- Late night: sleep, ambient
- Friday: Release Radar, weekend playlists
- Monday: Discover Weekly

---

## Screen 2: Search / Browse

### Purpose
Active discovery. When users want to find something specific or explore by genre/mood. The search experience balances type-ahead suggestions with visual browsing.

### Layout (Pre-Search State)

```
+--------------------------------------------------+
|  🔍  What do you want to listen to?               |
+--------------------------------------------------+
|                                                  |
|  Browse all                                       |
|                                                  |
|  +--------------+  +--------------+               |
|  |              |  |              |               |
|  |  🎙          |  |  🎸          |               |
|  |  Podcasts    |  |     Rock     |               |
|  |              |  |              |               |
|  +--------------+  +--------------+               |
|  +--------------+  +--------------+               |
|  |              |  |              |               |
|  |  🎤          |  |  💻          |               |
|  |     Pop      |  |  Electronic  |               |
|  |              |  |              |               |
|  +--------------+  +--------------+               |
|  +--------------+  +--------------+               |
|  |              |  |              |               |
|  |  🎧          |  |  🏃          |               |
|  |    Hip-Hop   |  |    Workout   |               |
|  |              |  |              |               |
|  +--------------+  +--------------+               |
|  +--------------+  +--------------+               |
|  |              |  |              |               |
|  |  😴          |  |  🍽          |               |
|  |    Sleep     |  |    Dinner    |               |
|  |              |  |              |               |
|  +--------------+  +--------------+               |
|                                                  |
+--------------------------------------------------+
```

### Genre/Mood Tile Design System

- 2-column grid on mobile, 4+ columns on desktop
- Each tile: 12px border-radius, ~150-200px height, unique gradient background
- Genre name: 20px Bold, white, positioned bottom-left
- Optional emoji/icon: Top-right, large (40px+)
- Tile gradients are carefully designed per genre:
  - Pop: Pink-to-red gradient
  - Rock: Deep blue-to-teal
  - Hip-Hop: Orange-to-coral
  - Electronic: Purple-to-pink
  - Podcasts: Green gradient (brand connection)
  - Workout: Energetic red-to-orange
  - Sleep: Deep purple-to-blue
  - Focus: Cool blue-to-teal
  - Dinner: Warm amber-to-orange

### Search State (After Typing)

```
+--------------------------------------------------+
|  [←]  🔍  The Weekend                             |
+--------------------------------------------------+
|  Top result                                       |
|  +-------------------+                            |
|  |  [Artist Avatar]  |                           |
|  |                   |  The Weeknd                |
|  |     (circular)    |  Artist                    |
|  +-------------------+                            |
|                                                  |
|  Songs                                            |
|  +--+                                             |
|  |  | Blinding Lights               The Weeknd    |
|  +--+                                             |
|  +--+                                             |
|  |  | Save Your Tears               The Weeknd    |
|  +--+                                             |
|  +--+                                             |
|  |  | Starboy ft. Daft Punk        The Weeknd    |
|  +--+                                             |
|                                                  |
|  Artists                                          |
|  +--+  The Weeknd                                |
|  |  |                                            |
|  +--+                                            |
|  +--+  The Weeknd & Ariana Grande                 |
|  |  |                                            |
|  +--+                                            |
|                                                  |
|  Albums                                           |
|  +--+  After Hours                               |
|  |  |  2020 · Album · The Weeknd                 |
|  +--+                                            |
|  +--+  Dawn FM                                   |
|  |  |  2022 · Album · The Weeknd                 |
|  +--+                                            |
|                                                  |
|  Playlists                                        |
|  +--+  This Is The Weeknd                        |
|  |  |  By Spotify                                |
|  +--+                                            |
|                                                  |
+--------------------------------------------------+
```

### Search Results Structure

Results are grouped by category with clear headers:
1. **Top result**: The most relevant artist, album, or playlist. Large card with prominent art.
2. **Songs**: Horizontal scrollable row of top tracks. Each shows album art + track name + artist.
3. **Artists**: Circular avatars with artist name. Limited to 2-4 shown inline.
4. **Albums**: Square covers with album name and year.
5. **Playlists**: Square covers with playlist name and creator.
6. **Podcasts & Shows**: If relevant to search.
7. **Profiles**: User profiles.
8. **See all results**: Link at the bottom to view exhaustive results.

### Interaction Flow
1. User taps search → types query
2. Results appear in real-time (type-ahead, 200ms debounce)
3. Top result is visually prominent — designed for quick access to the most likely target
4. Tapping a song starts playback immediately
5. Tapping an artist/album/playlist navigates to detail view
6. Clearing search returns to browse mode
7. Voice search (microphone icon) triggers device voice input

---

## Screen 3: Library

### Purpose
The user's personal collection. Saved playlists, albums, artists, podcasts, and downloaded content. This is the "my music" view — familiar, organized, quick to access.

### Layout

```
+--------------------------------------------------+
|  Your Library                                     |
|  [Playlists] [Albums] [Artists] [↓ Podcasts]      |
+--------------------------------------------------+
|  [🔍 Search in library]              [Grid ▦] [≡] |
+--------------------------------------------------+
|                                                  |
|  [Grid View]                                     |
|                                                  |
|  +--------+  +--------+  +--------+              |
|  |  COVER |  |  COVER |  |  COVER |              |
|  |        |  |        |  |        |              |
|  | Daily  |  | Release|  |  Liked |              |
|  | Mix 1  |  | Radar  |  | Songs  |              |
|  +--------+  +--------+  +--------+              |
|  +--------+  +--------+  +--------+              |
|  |  COVER |  |  COVER |  |  COVER |              |
|  |        |  |        |  |        |              |
|  | Workout|  |  Chill |  | Discover|              |
|  |  Mix   |  |  Vibes |  | Weekly |              |
|  +--------+  +--------+  +--------+              |
|                                                  |
|  (or List View)                                  |
|                                                  |
|  +--+  Daily Mix 1                               |
|  |  |  Playlist · Spotify                        |
|  +--+                                            |
|  +--+  Release Radar                              |
|  |  |  Playlist · Spotify                        |
|  +--+                                            |
|  +--+  Liked Songs                                |
|  |  |  Playlist · 342 songs · ♥                  |
|  +--+                                            |
|  +--+  Discover Weekly                            |
|  |  |  Playlist · Spotify                        |
|  +--+                                            |
|                                                  |
+--------------------------------------------------+
```

### Filter Tabs

```
[Playlists] [Albums] [Artists] [Podcasts & Shows] [Downloaded]
```

- Horizontal scrollable pills below the header
- Active tab: White background, black text (or white text with green underline)
- Inactive tabs: Gray text
- "Downloaded" tab filters to show only offline-available content
- Tabs persist the user's last selection

### View Toggle

- Grid icon button (right side of the search bar row)
- Toggles between grid view (3-column album art) and list view (art + metadata rows)
- Grid is the default for visual browsing
- List is preferred for searching/sorting within a large library

### Sort/Filter Options

- Dropdown next to search icon
- Options: Recently played, Recently added, Alphabetical, Creator
- "Recently played" is the default (most useful for quick access)
- Filter changes re-sort the visible content immediately

### Library Actions

**Swipe (mobile) or Right-click (desktop) on items:**
- Add to queue
- Add to playlist
- Remove from library
- Share
- Download (if Premium)

**Multi-select (long press on mobile):**
- Select multiple items
- Bulk actions: Add to playlist, Remove, Download

### Empty State
```
+--------------------------------------------------+
|                                                  |
|                                                  |
|            Create your first playlist             |
|                                                  |
|    It's easy! Tap the + button to get started.   |
|                                                  |
|          [Create Playlist  (green pill)]          |
|                                                  |
|                                                  |
+--------------------------------------------------+
```

### Interaction Flow
1. User taps Library tab → sees playlists (default) sorted by recently played
2. Switches tabs to filter by content type
3. Taps an item → navigates to playlist/album/podcast detail
4. Toggles grid/list view for preferred browsing
5. Searches within library to find specific saved content
6. Long-press/swipe for contextual actions
7. Pulls down to refresh (syncs library)

---

## Screen 4: Now Playing (Full Screen)

### Purpose
The immersive playback experience. This is where the user engages deepest with the music. The design must be beautiful, functional, and feel like a premium music player.

### Layout

```
+--------------------------------------------------+
| [↓ Collapse]                         [⋯ Options]  |
+--------------------------------------------------+
|                                                  |
|              +------------------+                |
|              |                  |                |
|              |                  |                |
|              |   CANVAS /       |                |
|              |   ALBUM ART      |                |
|              |                  |                |
|              |                  |                |
|              +------------------+                |
|                                                  |
|  Blinding Lights                          [❤]    |
|  The Weeknd                                       |
|                                                  |
|  [━━━━━━━━━━━━━━━━━●━━━━━]                        |
|    1:23                          2:54            |
|                                                  |
|  [🔀]      [⏮]      [▶⏸]      [⏭]      [🔁]     |
|   Shuffle   Prev   64px Play   Next     Repeat    |
|                                                  |
|  +------+                          +-----------+ |
|  | 🔊  |                          | 🎵 Queue  | |
|  +------+                          +-----------+ |
|  Connect to device                Up next        |
|                                                  |
+--------------------------------------------------+
```

### Zone Breakdown

**Zone 1: Top Controls**
- Collapse chevron (top-left): Swipes down to return to mini player
- Options menu (top-right): Share, Go to album, Go to artist, Add to playlist, View credits, Sleep timer
- Minimal presence — they exist but don't compete for attention

**Zone 2: Album Art / Canvas**
- Album art: Full-width (padding 32px each side), square, 4px radius
- Canvas: Looping video that replaces static album art. Artist-uploaded, 3-8 second loops.
- Default: Static album art. Canvas is an enhancement when available.
- Background: Dynamic gradient sampling dominant colors from the album art
- This zone occupies 50-60% of the screen — it IS the visual experience

**Zone 3: Track Info**
- Track name: 24px Bold, `#FFFFFF`, single line (rarely truncates due to screen width)
- Artist name: 14px Book, `#B3B3B3`, linked (tappable → artist page)
- Heart icon: 24px, outlined green when liked, `#B3B3B3` when not. Tap to toggle.
- Canvas attribution: Small "Canvas by [Artist]" label when Canvas is playing

**Zone 4: Progress Bar**
- Track position: 4px height for the bar
- Background: `#535353` (gray)
- Past progress: `#1DB954` (green) behind thumb, or `#FFFFFF` on hover/touch
- Thumb: 12px circle, `#FFFFFF`, appears on hover/touch, otherwise hidden
- Timestamps: 12px Book, `#B3B3B3`, below the bar (current time left, duration right)
- Scrubbing: Drag thumb or tap along bar to seek. Fine scrubbing: drag downward for precision.

**Zone 5: Playback Controls**
- 5 control buttons in a row, centered
- Layout: Shuffle (24px) — Previous (32px) — Play/Pause (64px circle) — Next (32px) — Repeat (24px)
- Play/Pause: Green circle (#1DB954), white triangle (play) or white bars (pause)
- Shuffle active: Green dot below the icon. Shuffle inactive: White icon, no dot.
- Repeat active: Green dot below icon. Repeat one: Small "1" numeral in green.
- Labels: Below each icon, 10px Book, `#B3B3B3` — "Shuffle", "Prev", "Next", "Repeat"
- Spacing: Even distribution across the row

**Zone 6: Bottom Actions**
- Left: Connect to device icon (speaker + screen) — opens device picker
- Right: Queue icon (layered lines) — opens queue view
- These are secondary actions, smaller icons (20-24px), with labels
- Device picker: Bottom sheet showing available speakers, devices, groups

### Background Gradient System

The Now Playing background dynamically samples dominant colors from the album art:
```css
background: linear-gradient(
  180deg,
  {dominant-color} 0%,
  {secondary-color-mix} 50%,
  #121212 100%
);
```

- Creates an immersive, album-specific atmosphere
- Smooth transitions between tracks (cross-fade the gradient)
- If album art is dark/monochrome, gradient stays subtle
- If album art is vibrant, gradient amplifies the mood

### Gestures
- Swipe down on album art → collapse to mini player
- Swipe left on album art → next track
- Swipe right on album art → previous track
- Tap album art → toggle Canvas (show/hide)
- Long press on album art → context menu (Share, Add to playlist)
- Swipe up from bottom → open queue view

### Lyrics View (Optional Overlay)

```
+--------------------------------------------------+
|  [Lyrics]                                         |
|                                                  |
|          I've been tryna call                     |
|          I've been on my own for long enough      |
|          Maybe you can show me how to love        |
|          Maybe...                                 |
|                                                  |
|          I'm going through withdrawals            |
|          You don't even have to do too much       |
|          You can turn me on with just a touch     |
|          baby...                                  |
|                                                  |
|          I look around and                        |
|          Sin City's cold and empty                |
|          No one's around to judge me              |
|          I can't see clearly when you're gone     |
|                                                  |
+--------------------------------------------------+
```
- Toggle between Canvas view and Lyrics view (tab or swipe)
- Lyrics are time-synced — current line highlighted in white, others in `#B3B3B3`
- Auto-scrolls with the song
- Shared via Musixmatch or other lyric provider
- Tap a line to seek to that position

---

## Screen 5: Playlist Detail

### Purpose
Showcase a playlist or album with its full track list, metadata, and action controls. This is where users decide whether to save, share, or dive into a collection.

### Layout

```
+--------------------------------------------------+
|                                                  |
|  +------+                                        |
|  | COVER|  PLAYLIST                              |
|  |      |                                       |
|  | 232px|  Songs to Sing in the Shower           |
|  |      |  The perfect playlist for your...       |
|  |      |                                        |
|  |      |  • Spotify                             |
|  |      |  • 2,450,123 saves                     |
|  |      |  • 50 songs, about 3 hr 15 min         |
|  +------+                                        |
|                                                  |
+--------------------------------------------------+
|  [▶ Play]  [🔀 Shuffle]  [♡ 2.4M]  [⋯ More]     |
+--------------------------------------------------+
|  #   TITLE                                  ⏱   |
+--------------------------------------------------+
|      +--+                                        |
|  1   |  |  Don't Stop Me Now          3:29      |
|      +--+  Queen                                 |
|      +--+                                        |
|  2   |  |  Dancing Queen               3:51      |
|      +--+  ABBA                                  |
|      +--+                                        |
|  3   |  |  I Wanna Dance with Somebody  4:52     |
|      +--+  Whitney Houston                       |
|      [Explicit]                                  |
|      +--+                                        |
|  4   |  |  Uptown Funk                4:30      |
|      +--+  Mark Ronson ft. Bruno Mars            |
|                                                  |
+--------------------------------------------------+
```

### Header Design

**Cover Image + Metadata:**
- Cover: 232x232px (desktop) / 192x192px (mobile), 4px radius, shadow
- Content type label: 12px Bold, all-caps, white ("PLAYLIST", "ALBUM", "ARTIST")
- Name: 28-96px Bold, white, responsive sizing (shorter names = larger text, longer names scale down), letter-spacing -1px to -2px
- Description: 14px Book, `#B3B3B3`, multi-line (up to 3 lines, then truncate)
- Creator/Artist: 14px Bold, `#FFFFFF`, linked
- Metadata row: 14px Book, `#B3B3B3`, dot-separated (Saves count, Song count, Duration)
- Background: Solid `#121212` or subtle gradient sampled from cover art

**Action Row:**
```
[▶ Play]  [🔀 Shuffle]  [♡ 2.4M]  [⋯ More]
```
- Play: Green pill button, 48px height, white Bold all-caps text
- Shuffle: White outlined pill, 48px height
- Heart/Like: Icon button (24px). Green when liked, gray when not. Shows like count.
- More (•••): Options menu: Add to queue, Add to playlist, Share, Download, Exclude from taste profile
- On saved playlists: Heart is pre-filled green

### Track List

**Track Row Component:**
```
+--+                                               |
|  |  Track Name                          [E] 3:29 |  ← Now playing (green text)
+--+  Artist Name                           [♥]   |
```
- Row height: 56px
- Album art thumbnail: 40x40px, 4px radius, left
- Track number: 16px Book, `#B3B3B3` (1-indexed). Switches to green speaker icon when playing.
- Track name: 16px Book, `#FFFFFF`. Green when currently playing.
- Artist name: 14px Book, `#B3B3B3`, linked below track name
- Explicit badge: Small "E" in a box, 12px, gray
- Duration: 14px Book, `#B3B3B3`, right-aligned
- Like button: 16px heart icon, appears on hover/tap (mobile shows by default)
- Currently playing: Green speaker/equalizer icon + green text + subtle highlight background (#282828)
- Tap: Plays the track
- Long press or swipe: Context menu

### Sticky Header Behavior (Scroll)
- As user scrolls down the track list:
  - Header collapses: Cover art shrinks, title resizes smaller
  - Action row becomes sticky at the top
  - Background solidifies to `#121212`
  - Scroll position indicator: Subtle progress bar at top

### Playlist Recommendations (Bottom of page)

```
+--------------------------------------------------+
|  Recommended based on this playlist               |
|                                                  |
|  +-----------------+  +-----------------+          |
|  |     COVER       |  |     COVER       |          |
|  |                 |  |                 |          |
|  | Feel Good Songs |  | Happy Hits      |          |
|  +-----------------+  +-----------------+          |
|                                                  |
+--------------------------------------------------+
```
- Appears below the track list after scrolling
- "Recommended based on this playlist" header
- Horizontal scrollable row of similar playlists
- Algorithmically generated based on the current playlist's content

### Interaction Flow
1. User arrives from Home, Search, or Library
2. Views cover art, title, and track list
3. Taps Play to start playback from the beginning
4. Taps Shuffle for randomized playback
5. Taps Heart to save to library
6. Scrolls through track list
7. Taps a track to play it
8. Sticky header provides constant access to Play/Shuffle/Heart
9. Scrolls to bottom for recommendations
10. Shares playlist via ••• menu

### Playlist Edit Mode (Owner Only)

```
+--------------------------------------------------+
|  [Done]                                           |
+--------------------------------------------------+
|  +--+  ≡  Track One                   Artist   ⏱ |
|  +--+                                            |
|  +--+  ≡  Track Two                   Artist   ⏱ |
|  +--+                                            |
|  +--+  ≡  Track Three                 Artist   ⏱ |
|  +--+                                            |
|                                                  |
|  [Add songs (green pill)]                         |
+--------------------------------------------------+
```
- Drag handle (≡) on each track for reordering
- Red minus circle on left to remove tracks
- "Add songs" button at bottom
- "Done" saves changes
