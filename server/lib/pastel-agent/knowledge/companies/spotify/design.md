# Spotify UI - Replication Specification

## Scope and reference
`references/home.jpg` is the desktop logged-out home: black shell, left library rail,
top search/navigation, dark media rows, square song cards, circular artist cards, and a
fixed purple-blue "Preview of Spotify" signup bar. Reproduce this app surface, not a green
marketing landing page.

## Tokens
```css
:root { --bg:#121212;--rail:#000;--card:#181818;--raised:#242424;--ink:#fff;--muted:#b3b3b3;
  --green:#1db954;--green-hover:#1ed760;--line:#2e2e2e;--font:Arial,Helvetica,sans-serif;
  --s1:4px;--s2:8px;--s3:12px;--s4:16px;--s6:24px;--s8:32px;--s12:48px;
  --r-card:8px;--r-pill:999px;--shadow:0 8px 20px rgba(0,0,0,.4); }
```
Type: topbar `14px/1/600`, row heading `24px/1.2/700`, card title `15px/1.3/400`, metadata
`14px/1.3/400`. Use white primary, muted gray secondary, and tabular track durations.

## Layout and components
Viewport is a 12px outer padding grid. Left rail is 294px, black, rounded 8px, with logo,
Your Library row, plus button, two dark onboarding cards, and legal/language links. Main
content is dark `--bg`, topbar 56px with home circle, 470px search pill ("What do you want
to play?"), nav links, install, signup and white `Log in` pill.

`MediaRow` has heading and right "Show all"; horizontal cards are 154x154 square artwork,
8px radius, title and artist line. `ArtistRow` uses 154px circles. Cards are `--card` on
hover with a green circular play button appearing at bottom-right. The bottom signup bar
is fixed, 68px, rounded 8px, purple-to-blue gradient, preview title/copy left and white
`Sign up free` pill right.

Hover lifts card 2px; active nav is white, inactive is muted; keyboard focus is a green
2px ring. Play buttons scale from .96 to 1. At 900px rail becomes 240px; at 700px hide
secondary top links and make rail a 72px icon strip; at 520px show one-column content,
122px cards, and stack preview copy/button. Respect bottom bar safe-area padding.
Voice is casual and compact: "Trending songs", "Popular artists", "Made for you".

## 6. Detailed build contract
Global shell: 12px grid, black 294px rail, dark main, exact tokens, 56px topbar, fixed bottom signup clearance.
Recipe 1: rail -> topbar/search -> square MediaRows -> circular ArtistRow -> Preview bar.
Recipe 2: selected Library rail -> topbar -> saved media rows -> clipped rails -> fixed signup bar.
Recipe 3: rail -> wide search pill -> result row -> artist row -> preview bar; empty results remain empty.
Library rail: 294px desktop, 72px icon strip tablet, rounded 8px, 16px padding, white/muted hierarchy.
Topbar: 56px, home circle, 470px search pill, nav/install/signup, white 40px login pill.
Media card: 154px square artwork, 8px radius, title and artist; hover uses `--card`.
Artist card: 154px circle, centered label, no rectangular background.
Play button: green circle at bottom-right on hover, scale .96 to 1.
Preview bar: fixed 68px purple-blue surface, title/copy left, white Sign up free pill right.
Use exact existing colors `--bg:#121212`, `--rail:#000`, `--green:#1db954`, `--raised:#242424`.
Active nav is white, inactive muted; focus is a green 2px ring; cards lift 2px.
At 900px rail is 240px; at 700px links hide and rail is 72px; at 520px cards are 122px and content one column.
Rails clip naturally and never shrink cards to fit; preserve bottom safe-area padding.
Voice is casual: `Trending songs`, `Popular artists`, `Made for you`.
Hard avoids: green marketing landing page, playback controls, signed-in assumptions, or invented album art.
Reference Caveats
- Rail overflow is intentional; rightmost cards may be clipped.
- Artwork is square for media and circular for artists; never interchange them.
- The preview bar remains visible for logged-out users and uses safe-area padding.
- Reference Caveats: blank and unloaded intervals are excluded from design inference.
The rightmost cards are intentionally clipped by the viewport; use overflow rails, not a
shrunk grid. The screenshot is logged out, so keep onboarding cards and signup bar visible.
