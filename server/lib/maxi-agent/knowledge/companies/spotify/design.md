# Spotify design language

## When to reach for this reference
Use Spotify's design language when building media-heavy consumer apps — music players, podcast platforms, video streaming, or any product where cover art and editorial imagery are the primary visual material. It is the reference for dark-canvas-first design, for products where boldness and cultural relevance matter, and for interfaces that need to feel like a curated experience rather than a utility. Also a strong reference for personalization-driven UIs.

## Brand personality
Bold, confident, and culturally fluent. Spotify positions itself at the intersection of technology and culture — it is as much a lifestyle brand as a technology product. The personality is self-assured and unapologetic: it doesn't ask for your attention, it assumes it. There is a restless energy to the platform, driven by constant updates (new releases, personalized playlists, live events). It feels young, global, and plugged into the zeitgeist.

## Color philosophy
A dramatic black canvas with a single, unmistakable green accent. The background is a deep near-black (`#121212` or `#000000`) that makes album art, artist photography, and playlist covers look luminous by comparison. The Spotify green (`#1DB954`) is the only accent that matters — it appears on play buttons, active states, progress bars, and the branded "shuffle" and "repeat" indicators. Supporting UI surfaces use slightly lighter dark grays (`#282828` for cards, `#181818` for the now-playing bar) to create subtle layering within the dark palette. Album art and playlist covers provide all the additional color the interface needs. Light mode is not a consideration — the product is dark-mode-only by design philosophy, not just preference.

## Typography approach
Confident, contemporary, and editorial in feel. Spotify uses a proprietary geometric sans-serif (historically Circular, now a custom family) in bold weights for headings — large, tightly-spaced, impactful. Body and metadata text use lighter weights at smaller sizes (12–14 px) but remain crisp and legible on the dark background. The headline typography on playlist pages and artist profiles can be enormous (48–72 px) — poster-sized, confident, and unapologetic. Letter-spacing is tight by default, occasionally tracked out very slightly for uppercase labels. The type system has range: it can whisper metadata and shout album titles with equal conviction.

## Spacing & density
Image-led with generous breathing room. The home screen and browse views use grid-based layouts with album art as the dominant element — cards are typically 150–180 px wide with 12–16 px gaps. Text labels sit below artwork with 4–8 px of separation. On mobile, the primary navigation (Home, Search, Library) lives at the bottom in a compact 48–56 px bar. The now-playing bar sits above it as a persistent, slim strip (64 px). Content sections are separated by 20–32 px of vertical space with clear, all-caps section headers. The overall density is medium — more spaced out than Linear, more compact than Airbnb.

## Corner radius & shape language
Soft but not cute. Album art and playlist covers use 4–8 px rounding — enough to take the edge off without softening the editorial impact. Buttons are pill-shaped: the signature play button is a perfect circle in Spotify green with a white triangular icon. Navigation pills and genre tags are fully rounded capsules. Context menus, tooltips, and dropdowns use 6–8 px rounding. Cards that contain album art match the art's corner radius exactly for seamless integration. No squircle shapes — the geometry is either rectangular (with eased corners) or perfectly circular.

## Elevation & depth
Layered dark surfaces with very subtle elevation. Since everything is dark, depth is created by progressively lightening the gray value of elevated surfaces. The base background is `#121212`; cards sit at `#181818`; hovered or selected items at `#282828`; popovers and dropdowns at `#333333`. Shadows are minimal since they don't read well on dark backgrounds; instead, elevated surfaces get a very subtle 1 px light border or enhanced background contrast. The now-playing bar sits at the bottom with a slight elevation above the navigation, reinforced by a hairline top border.

## Iconography & imagery
Icons are geometric, stroke-based, and consistent at 24×24 px with a 1.5–2 px weight. The style is modern and clean — rounded caps, open counters, no filled variants except for active states. Album art and artist photography are the visual core of the product. They are displayed large, crisp, and without any UI overlay or tint. Playlist covers are a mix of custom illustration, collage, and typographic compositions — often trend-driven and culturally referential. Editorial imagery for podcast covers and audiobooks follows a similar square-format, high-impact approach. Artist photography is bold and personality-driven, reinforcing the cultural positioning.

## Signature patterns
- **The persistent now-playing bar** — a slim, always-visible strip at the bottom of mobile (or bottom-left on desktop) that keeps playback control permanently accessible
- **The green play button** — a universally recognized circular button with a centered play triangle, appearing on every album, playlist, and track row
- **Personalized algorithmic playlists** — Daily Mixes, Discover Weekly, and Release Radar that feel hand-curated but are machine-generated
- **Canvas looping visuals** — short, silent video loops that replace album art during playback, turning the listening experience into a visual one
- **Wrapped year-in-review** — an annual, shareable data-story that visualizes listening habits with bold typography and gradient overlays
- **Card-based content feeds** — horizontally scrollable rows of album/playlist cards with consistent sizing
- **The heart/like button** — a context-ubiquitous action that saves content and trains the recommendation engine

## Motion philosophy
Smooth, rhythmic, and magazine-like. Page transitions use 250–350 ms cross-fades or slides. The play button depresses with a subtle scale-down and the icon morphs to a pause symbol with a clean transition. The now-playing bar (mobile) slides in and out of view in sync with scroll direction. The Canvas feature — looping video behind album art — is the most visible use of motion, transforming a static album cover into an ambient visual. Scroll-driven parallax on artist pages adds editorial polish. Playlist header artwork fades under the navigation bar as the user scrolls. Loading states use skeleton screens that pulse gently.

## Voice & copy tone
Culturally aware, confident, and playful. Copy is colloquial and current — it speaks the user's language, literally and figuratively. Playlist descriptions are witty and self-aware. Push notifications feel like a friend's recommendation rather than a corporation's alert. Error states use personality: "Something went wrong. Try that again?" Artist and album descriptions are editorial in tone. The voice adjusts per context — more restrained in account settings, more personality-driven in playlist titles and discovery features. Never formal, never corporate, never boring.

## Explicitly do not
- Do not reproduce Spotify logos, the green circle sound-wave mark, wordmarks, or trademarked assets
- Do not copy Spotify's UI copy, playlist names, or editorial content verbatim
- Do not build music streaming interfaces that replicate Spotify's specific layout, navigation model, or recommendation features
- This reference describes a design language to draw from — it is not a license to clone any specific Spotify interface
