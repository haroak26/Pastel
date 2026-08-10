# Picasso Product Mode: App Social

## Mode Definition

**Social App** — A platform where users interact with other users' content: feeds, messaging, communities, forums, discussion platforms. The core experience revolves around user-generated content, real-time interaction, and community building. The interface must feel alive, responsive, and social — not static or document-like.

---

## Core Layout Variations

### 1. Feed-Based Layout (2 or 3 Columns)

The most common social app layout. Content flows in the center column.

```
┌────┬──────────────────────────────┬─────────────────────┐
│    │                              │                     │
│    │                              │                     │
│ Nav│                              │  Trends             │
│    │       Content Feed           │  · #technology      │
│    │       (600–680px)            │  · #design          │
│    │                              │  · #programming     │
│    │  ┌────────────────────────┐  │                     │
│    │  │ [Avatar] Name · 2h ago │  │  Suggested Follows  │
│    │  │                        │  │  [Av] Person A      │
│    │  │ Content body text...    │  │  [Av] Person B      │
│    │  │                        │  │  [Av] Person C      │
│    │  │ [Image/Media]          │  │                     │
│    │  │                        │  │  Footer             │
│    │  │ ♥ 42  💬 12  🔁 5  🔖 │  │  · Terms · Privacy   │
│    │  └────────────────────────┘  │  · © 2024           │
│    │                              │                     │
│    │  ┌────────────────────────┐  │                     │
│    │  │ Another post...        │  │                     │
│    │  └────────────────────────┘  │                     │
│    │                              │                     │
│    │  (infinite scroll)           │                     │
│    │                              │                     │
└────┴──────────────────────────────┴─────────────────────┘
  240px         600–680px                 280–320px
```

| Region | Width | Content |
|---|---|---|
| Left sidebar | 220–280px | Navigation, communities/groups, user profile link |
| Center feed | 600–680px | Infinite scroll of content cards, compose box at top |
| Right sidebar | 280–320px (optional) | Trends, suggested follows, search, footer links |

**When to use 3 columns:** Content-heavy feeds (Twitter/X, Reddit, LinkedIn). The right sidebar provides discovery.
**When to use 2 columns:** Simpler feeds (Instagram, Facebook). Right sidebar is unnecessary or collapsed.

### 2. Messaging Layout (3 Columns)

Direct messaging and chat interfaces.

```
┌──────────┬─────────────────────────────┬──────────────────┐
│          │                             │                  │
│ Chat List│     Active Conversation     │  Detail Panel    │
│ (320px)  │                             │  (optional)      │
│          │  ┌─────────────────────────┐│                  │
│ 🔍 Search │  │                         ││  Shared Photos   │
│          │  │  Message bubble (them)   ││  ┌──┐ ┌──┐ ┌──┐│
│ ┌──────┐ │  │                         ││  │  │ │  │ │  ││
│ │Emma  │ │  │  Message bubble (you)    ││  └──┘ └──┘ └──┘│
│ │Online │ │  │                         ││                  │
│ └──────┘ │  │  Message bubble (them)   ││  Pinned Messages │
│ ┌──────┐ │  │                         ││  · "Meeting Tue" │
│ │James │ │  │  Message bubble (you)    ││                  │
│ │Typing │ │  │                         ││  Shared Files    │
│ └──────┘ │  │                         ││  · proposal.pdf  │
│          │  │  ...more messages...     ││  · notes.txt     │
│ │Sarah  │ │  │                         ││                  │
│ │2h ago  │ │  └─────────────────────────┘│                  │
│ └──────┘ │                             │                  │
│          │  ┌─────────────────────────┐│                  │
│          │  │ Type a message...  [📎] ││                  │
│          │  └─────────────────────────┘│                  │
└──────────┴─────────────────────────────┴──────────────────┘
  320px              flex-1                      300px
```

| Region | Width | Content |
|---|---|---|
| Conversation list | 320px | Search bar at top. Scrollable list of conversations. Each item: avatar + name + last message preview + timestamp + unread badge |
| Chat area | `flex: 1` | Header (name + status + action buttons), message list (scrollable, newest at bottom), compose bar (sticky bottom) |
| Detail panel | 300–360px (optional) | Shared media, pinned messages, shared files, member list. Collapsible |

**Mobile adaptation:**
```
┌──────────────────┐    ┌──────────────────┐
│                  │    │                  │
│  Conversation    │ -> │  Chat View       │
│  List            │    │  (push)          │
│                  │    │                  │
└──────────────────┘    └──────────────────┘
```

Chat list and chat view are separate screens on mobile. Push navigation from list → chat. Back button returns to list.

### 3. Profile / Community Layout

User profiles and community/group pages.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │                Cover Image/Banner                     ││  ← 200–320px height
│  │                   (200–320px)                         ││     gradient or image
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│       ┌────┐                                             │
│       │    │  User Name                                  │  ← Avatar overlaps
│       │ Av │  @username                                  │     cover bottom
│       └────┘  Bio text goes here. Developer & designer.  │
│               🏙 San Francisco · Joined March 2022       │
│               42 Following   1,284 Followers             │
│               [Follow] [Message] [•••]                   │
│                                                          │
│  ────────────────────────────────────────────────────── │
│  ┌─────┬─────┬─────┬─────┐                                │
│  │Posts│Media│Likes│About│                                │  ← Tab bar
│  └─────┴─────┴─────┴─────┘                                │
│  ────────────────────────────────────────────────────── │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │ [Avatar] Name · 2h                                   ││
│  │                                                      ││
│  │ Post content...                                      ││
│  │                                                      ││
│  │ ─────────────────────────────────────────────────── ││
│  │ ♥ 42   💬 12   🔁 5   🔖                           ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  (more posts via infinite scroll or pagination)          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Element | Specification |
|---|---|
| Cover image | 200–320px height, full container width. Gradient or user-uploaded image. Avatar overlaps the bottom edge |
| Avatar | 80–120px diameter, circular. Profile photo or initials on colored background. Positioned to overlap cover bottom edge (negative margin ~50% of avatar height) |
| Profile info | Name (20–24px, weight 700), @handle (14–15px, neutral-500), bio (14–15px), location/join date (13px, neutral-500 with icons), follow counts (14px) |
| Action buttons | "Follow" (accent-500 filled or outlined depending on state), "Message" (outlined), overflow menu (•••) |
| Tab bar | Below profile header. Tabs: Posts, Media, Likes, About, etc. Full-width, 44–48px height. Active tab: accent-500 underline indicator (2–3px) |
| Content feed | Below tabs. Same content card design as main feed |

---

## Content Card Design

### Card Anatomy

The content card is the fundamental unit of social interfaces. Every post, comment, or update follows this structure.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌────┐  User Name                · 2 hours ago         │
│  │ Av │  @username                                [•••] │  ← Header: avatar + metadata
│  └────┘                                                  │
│                                                          │
│  Just shipped a new feature! Here's what we built and    │  ← Content body
│  why it matters to your workflow...                      │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │                                                      ││  ← Media attachment
│  │              [Image / Video / Embed]                  ││     (optional)
│  │                                                      ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ────────────────────────────────────────────────────── │
│  ♥ 42      💬 12      🔁 5      🔖                     │  ← Interaction bar
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Element | Specification |
|---|---|
| Card container | White background, `border: 1px solid neutral-200`, `border-radius: 10–12px`, padding 16–20px. Or borderless with only bottom border |
| Avatar | 36–44px diameter, circular. User photo or initials on colored background |
| User name | 14–15px, weight 600–700, `neutral-900` |
| @handle | 13–14px, `neutral-500`, inline after name or on second line |
| Timestamp | 13–14px, `neutral-400`. Relative format: "2h ago", "Yesterday", "Mar 15" |
| Overflow menu | "•••" icon, 20px, `neutral-400`. Opens: Report, Mute, Block, Copy link, Embed |
| Content body | 15–16px, `neutral-800`. Line-height 1.5. Link previews show as cards with image + title + domain |
| Media attachment | If present: full-width image/video within card (no gap), `border-radius: 6–8px`. Single image: full-width. 2 images: side-by-side. 3+: grid layout |
| Interaction bar | 44–48px height. Icons: 18–20px, `neutral-400`. Counts: 13–14px, `neutral-500`. Hover: icon color changes to interaction color |

### Interaction Bar Details

```
♥ 42      💬 12      🔁 5      🔖         📊 1.2K
```

| Interaction | Icon (Default) | Icon (Active) | Active Color | Count |
|---|---|---|---|---|
| Like / Heart | ♡ (outline) | ♥ (filled) | `red-500` or `pink-500` | 42 |
| Comment | 💬 | 💬 (filled) | `accent-500` | 12 |
| Repost / Share | 🔁 | 🔁 (filled) | `green-500` | 5 |
| Bookmark | 🔖 (outline) | 🔖 (filled) | `accent-500` | — |
| Views / Impressions | 📊 | — | `neutral-400` | 1.2K |

**Interaction behavior:**
- Like: scale pop animation on icon (200ms, scale 1.3 → 1.0), color fill, count increments by 1
- Unlike: instant toggle, count decrements by 1
- Comment: expands inline comment input below the post. Smooth height transition (300ms ease-out)
- Repost: opens modal with "Repost" and "Quote" options
- Bookmark: instant toggle, no animation needed

### Card Types

| Type | Description |
|---|---|
| Text-only post | Title + body text. No media |
| Image post | Single image or gallery (2–4 images in grid). Image is the main content |
| Video post | Embedded video player with play button overlay |
| Link post | External link with preview card (image + title + description + domain) |
| Poll | Question + 2–4 options with percentage bars + vote button + remaining time |
| Shared/Repost | Original post embedded within repost card |

### Comment Threads

```
┌──────────────────────────────────────────────────────────┐
│  [Av] User A · 2h                                        │
│  Original post content...                                │
│                                                          │
│  ────────────────────────────────────────────────────── │
│                                                          │
│  ┌────┐  User B · 1h                                    │
│  │ Av │  Great post! Totally agree with your points.    │
│  └────┘  ♥ 3  💬 Reply  ···                             │
│                                                          │
│     ┌────┐  User C · 45m                                 │  ← Nested reply
│     │ Av │  @UserB same here! I've been thinking this... │     indent 48px
│     └────┘  ♥ 1  💬 Reply  ···                          │
│                                                          │
│  ┌────┐  Add a comment...                                │  ← Comment input
│  │ Av │  ┌──────────────────────────────────────┐       │
│  └────┘  │ Write a thoughtful reply...           │       │
│          └──────────────────────────────────────┘       │
│                                        [Post]            │
└──────────────────────────────────────────────────────────┘
```

| Element | Specification |
|---|---|
| Comment indent | Top-level: 0px. First reply: 36–48px indent. Second reply: 72–96px. Max 2–3 levels deep |
| Thread line | Optional: vertical line on left side connecting replies, `1px solid neutral-200` |
| Comment card | Avatar (28–32px) + name + timestamp + body + mini interactions |
| Inline reply input | Appears below the comment when "Reply" is clicked. Compact: 36–40px height, "Write a reply..." placeholder |
| Load more | "Show 8 more replies" link at bottom of collapsed thread |

---

## Real-Time Indicators

### Online / Offline Status

```
┌────┐
│ Av │  ← 8px green dot overlapping bottom-right of avatar
└────┘
    ●
```

| Status | Indicator | Color |
|---|---|---|
| Online | Solid circle, 8–10px, overlapping avatar bottom-right | `green-500` or `accent-500` |
| Away / Idle | Solid circle with slightly muted color | `yellow-400` or `orange-400` |
| Offline | No indicator, or gray circle | `neutral-400` |
| Do Not Disturb | Red circle with minus/line icon | `red-500` |

**Placement:** Dot is positioned absolute, bottom-right of avatar, with 1–2px white border to separate from avatar.

### Typing Indicator

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌────┐                                                 │
│  │ Av │  ● ● ●  (animated)                              │  ← In chat or DM
│  └────┘                                                 │     in place of last
│                                                          │     message bubble
└──────────────────────────────────────────────────────────┘
```

| Element | Specification |
|---|---|
| Dots | 3 dots, 6–8px each, `neutral-500` |
| Animation | Sequential fade-in/out (opacity 0.3 → 1.0 → 0.3), 1.2s cycle, staggered delay |
| Position | Left-aligned bubble area, in place of where the next message would appear |
| Label | Optional: "Emma is typing..." text in conversation list item |

### New Message / Notification Badges

```
┌──────┐       ┌──────────┐
│Emma  │  ● 3  │ 🔔     ● │  ← Red badge with count
└──────┘       └──────────┘
```

| Badge Type | Specification |
|---|---|
| Pill badge (count) | Red (`red-500`), rounded-full (pill shape). 18–20px height. White text 11–12px, weight 600. Padding 2–8px horizontal |
| Dot badge (indicator) | Red dot, 8–10px, no text. Indicates something new without a count |
| Unread indicator | Blue dot next to conversation or notification item. 6–8px. `accent-500` |

### "Seen" / Read Receipts

| Style | Specification |
|---|---|
| Checkmarks | Single gray checkmark: sent. Double gray: delivered. Double blue/accent: read |
| Avatar bubbles | Small circular avatars of users who have seen the message (WhatsApp/Telegram style). 16–20px each, overlapping slightly (-4px each) |
| "Seen by" text | "Seen by Emma and 3 others" text below the message |

---

## Empty States for Social

### Welcome / New User Empty State

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              Welcome to CommunityName!                    │
│              Your feed is a little empty.                 │
│              Follow people to see their posts.            │
│                                                          │
│         ┌────────┐  ┌────────┐  ┌────────┐              │
│         │ [Av]   │  │ [Av]   │  │ [Av]   │              │  ← Suggested
│         │ Alice  │  │ Bob C  │  │ Dora E │              │     follows
│         │ Follow │  │ Follow │  │ Follow │              │
│         └────────┘  └────────┘  └────────┘              │
│                                                          │
│         ┌──────────────────────────────────────────┐    │
│         │ Find people you know from your contacts    │    │  ← Import contacts
│         └──────────────────────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Element | Specification |
|---|---|
| Heading | 20–24px, weight 600. Welcoming but not marketing-y |
| Description | 14–16px, `neutral-500`. Explains what the user should do |
| Suggested follows | 3–5 user cards with avatar, name, and "Follow" button |
| Import contacts | Card or link to import contacts / find friends |

### Empty Feed (Following, No Posts)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                    📭                                    │  ← Icon: 48–64px,
│                                                          │     neutral-300
│              No posts yet                                │
│       When people you follow post,                       │
│       you'll see their content here.                     │
│                                                          │
│           [Discover people to follow →]                  │  ← Action button
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Empty Messages

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                    💬                                    │
│                                                          │
│              Start a conversation                        │
│       Send a message to connect with other               │
│       members of the community.                          │
│                                                          │
│              [New Message →]                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Empty Notifications

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                    🔔                                    │
│                                                          │
│              No notifications yet                        │
│       When someone likes, comments, or                    │
│       follows you, you'll see it here.                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Engagement Patterns

### Like Animation

**Implementation:**
1. User clicks the heart icon
2. Icon scales to 1.3x over 100ms (ease-out)
3. Icon changes from outline to filled and color shifts to red-500
4. Icon scales back to 1.0x over 100ms (ease-in)
5. If implemented: small particle burst from the icon (hearts or sparkles, 3–5 particles, fade out over 400ms)
6. Count increments by 1 with a subtle scale bounce

**Total duration:** ~200ms
**CSS timing:** `cubic-bezier(0.175, 0.885, 0.32, 1.275)` for the scale pop

### Comment Expansion

**Implementation:**
1. User clicks the comment icon or "Reply" text
2. Comment input slides open below the post
3. Height transition: `max-height` or `height: auto` with `transition: height 300ms ease-out`
4. Input auto-focuses
5. If there are existing comments, load and display them inline
6. Posting a comment adds it to the list with a fade-in animation (opacity 0 → 1, 200ms)

**DO NOT:**
- Navigate to a separate page for comments (keeps user in context)
- Use a modal for comment input (too disruptive for a lightweight action)

### Share / Repost Modal

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                      Share Post                          │  ← Modal overlay
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │ [Av] User Name · 2h                                  ││  ← Post preview
│  │ Post content preview (truncated to 2 lines)...        ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │ Add a comment (optional)...                           ││  ← Quote input
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  [Repost]        [Quote Post]                            │  ← Action buttons
│                                                          │
│  Or share via:                                           │
│  [Copy Link] [Twitter] [Email] [•••]                    │  ← Share options
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Element | Specification |
|---|---|
| Modal | Centered, 480–560px max-width. White background, rounded-12px, shadow-md |
| Post preview | Compact card showing the post being shared (avatar, name, truncated content) |
| Quote input | Optional textarea to add commentary to the repost |
| Repost options | Direct repost (shares immediately) + Quote post (shares with commentary) |
| Share links | Row of icon buttons for external sharing |

### Save / Bookmark Toggle

**Implementation:**
- Simple instant toggle
- Bookmark icon: unfilled (outline) → filled on click
- No animation needed beyond the icon change
- No count shown (bookmarks are private)
- Toast notification optional: "Saved to bookmarks" / "Removed from bookmarks"

---

## Navigation Patterns

### Persistent Sidebar (Desktop)

```
┌─────────────────────┐
│  🏠  Home           │
│  🔍  Explore        │
│  🔔  Notifications  │  ● 3
│  💬  Messages       │  ● 2
│  🔖  Bookmarks      │
│  👤  Profile        │
│                     │
│  ────────────────── │
│  Communities        │
│  ▸ Design           │
│  ▸ Engineering      │
│  ▸ Random           │
│                     │
│  [Create Post]      │  ← Prominent CTA
└─────────────────────┘
```

| Element | Specification |
|---|---|
| Width | 220–280px |
| Navigation items | Icon (20–22px) + label (14–15px). 44–48px height per item |
| Active item | accent-50 background, accent-500 text, left 3px accent-500 border |
| Notification badges | Red pill next to the label |
| Communities / groups | Below a divider. Collapsible/expandable per group |
| Create post button | Full-width accent-500, 40–44px height. Bottom of sidebar or below nav items |

### Mobile Tabbar (Bottom Navigation)

```
┌─────────┬──────────┬──────────┬───────────────┬──────────┐
│   🏠    │    🔍    │    ➕     │      🔔       │   👤     │
│  Home   │ Explore  │  Create  │ Notifications │ Profile  │
└─────────┴──────────┴──────────┴───────────────┴──────────┘
```

| Element | Specification |
|---|---|
| Height | 56–64px (plus safe-area padding on notched phones) |
| Background | White or `neutral-50`. Top `1px solid neutral-200` |
| Icons | 22–26px. Default: `neutral-500`. Active: `accent-500` |
| Labels | 10–11px, below icon. `neutral-500`. Active: `accent-500` |
| Create button | Centered, larger than other icons (48px circle), accent-500 filled, white icon. Rests above tabbar or replaces center tab |
| Badge | Red dot or pill on notification/chat tab |

### Topbar Search

```
┌──────────────────────────────────────────────────────────┐
│  🔍 Search for people, posts, or topics...    [⚙️] [👤] │
└──────────────────────────────────────────────────────────┘
```

| Element | Specification |
|---|---|
| Height | 52–64px |
| Search bar | Centered, 360–480px wide, 40–44px height. Rounded-full or rounded-8px. `neutral-100` background |
| Search icon | Inside input left, 16–18px, `neutral-400` |
| Placeholder | "Search..." or "Search people, posts, tags" |
| Results | Dropdown as user types. Recent searches, suggested accounts, trending topics |
| Settings icon | Right side. Opens settings/preferences |
| Profile icon | Right side. Opens profile menu |

---

## Anti-Patterns for Social

### 1. Marketing Hero

**WRONG:** A large hero section with "Welcome to SocialApp — the best way to connect!" at the top of the feed.

**Why it's wrong:** Social apps are about content. A hero pushes content below the fold. Users signed up to see posts, not marketing.

**CORRECT:** The feed starts immediately. New users see a welcome card inline in the feed (not a hero) with suggested follows.

### 2. Sparse Feeds

**WRONG:** An empty feed that says "No posts yet" with a blank white space underneath.

**Why it's wrong:** An empty feed kills retention. If there's no content, users won't return. The app must feel alive from moment one.

**CORRECT:**
- Pre-populate with trending/popular content (even if the user doesn't follow anyone)
- Show "Suggested for you" content based on interests selected during onboarding
- Show community-wide posts or announcements
- Never show a completely empty feed

### 3. Missing Real-Time Feedback

**WRONG:** After clicking "Like," the heart icon changes color but the count doesn't update, or the change happens after a page refresh.

**Why it's wrong:** Social interactions must feel immediate. A delay breaks the illusion of a live, connected space. If it takes a network round-trip, the UI should optimistically update.

**CORRECT:**
- Optimistic UI updates: like, bookmark, follow all update instantly in the UI
- Server sync happens in the background
- If the server rejects, revert the optimistic update and show an error toast (rare)

### 4. Generic Profile Placeholders

**WRONG:** Gray circle with a generic silhouette for every user without a profile photo.

**Why it's wrong:** Generic placeholders make the community feel anonymous and untrustworthy. Social apps need personality.

**CORRECT:**
- Generate colored avatar backgrounds deterministically from the user's name or ID
- Show initials on the colored background
- Color palette: 8–12 distinct, vibrant background colors
- Example: "Emma Watson" → pink background + "EW" initials

### 5. Ungrouped Notifications

**WRONG:** A notification feed that shows every single interaction as an individual item: "John liked your post" "Sarah liked your post" "Mike liked your post" "Anna liked your post" — filling the feed with repetitive items.

**Why it's wrong:** Grouped notifications are more scannable and feel less overwhelming. Individual items create notification fatigue.

**CORRECT:**
- Group by type: "John, Sarah, and 12 others liked your post"
- Group by time window: likes within a 30-minute window are collapsed
- Group by post: all interactions on a single post are shown as one notification card

**Grouping patterns:**
| Type | Grouping |
|---|---|
| Likes | "Emma and 42 others liked your post" |
| Follows | "James, Sarah, and 5 others followed you" |
| Comments | "3 new comments on your post" |
| Reposts | "Alex and 2 others reposted your post" |
| Mentions | Individual (these are intentional and personal) |

### 6. Missing Content Warnings

**WRONG:** All content displayed without any filtering or warnings.

**Why it's wrong:** User-generated content can contain sensitive, graphic, or spoiler content. Without controls, users may have negative experiences.

**CORRECT:** Support content warning overlays for:
- Sensitive content (blurred image + "Sensitive Content" overlay, click to reveal)
- Spoiler content (blurred text + "Spoiler" overlay)
- NSFW content (blurred with age gate or content filter)
- Trigger warnings (text banner before content)

---

## Brand Personality in Social

### Vibrant / Energetic (Gaming, Youth, Entertainment)

| Attribute | Specification |
|---|---|
| Color palette | Bright purples, neon pinks, vibrant blues. Gradients used freely |
| Typography | Bold headings, playful body font (rounded sans-serif) |
| Tone | Energetic, fun, expressive, casual |
| Surface treatment | Rounded corners (12–16px), colorful cards, gradient accents, animated backgrounds |
| Interaction style | Bouncy animations, particle effects, haptic-like visual feedback |
| Reference | Discord, TikTok, Twitch |

**Design keywords:** vibrant, bold, playful, animated, expressive, gamified

### Clean / Minimal (Professional Networking)

| Attribute | Specification |
|---|---|
| Color palette | Neutral grays, single accent color (blue), white backgrounds |
| Typography | Inter, SF Pro. Professional, no decorative fonts |
| Tone | Professional, credible, clean, understated |
| Surface treatment | Flat cards, thin borders, subtle shadows, minimal color |
| Interaction style | Subtle transitions, no bounce, professional tone |
| Reference | LinkedIn, Stack Overflow, GitHub Discussions |

**Design keywords:** professional, clean, credible, understated, structured, serious

### Warm / Community (Interest-Based, Niche Communities)

| Attribute | Specification |
|---|---|
| Color palette | Warm earth tones or soft pastels. Accent: warm orange or teal |
| Typography | Friendly serif or rounded sans-serif. Inviting |
| Tone | Warm, welcoming, inclusive, personal |
| Surface treatment | Soft shadows, rounded cards, warm background tints, community-art-inspired elements |
| Interaction style | Gentle animations, encouraging micro-copy, community badges and recognition |
| Reference | Goodreads, Strava, Letterboxd, Reddit (warm redesign) |

**Design keywords:** warm, welcoming, inclusive, personal, cozy, community-focused

---

## Real-World Reference Social Apps

### Twitter / X (Feed-Focused)
- **Mode:** Vibrant / real-time
- **Signature traits:** 3-column layout (sidebar, feed, trends), infinite scroll feed, 600px center column, content cards with minimal borders, blue accent, compose button in sidebar, real-time like/retweet counters
- **Key takeaway:** Speed and density. Content is king. Chrome recedes. Real-time updates are expected.

### Discord (Community + Messaging)
- **Mode:** Vibrant / energetic (gaming)
- **Signature traits:** Dark sidebar with server icons (48px circles), channel list (240px), chat area (flex-1), member list (240px), online/offline dots, typing indicators, custom emoji, voice channel UI
- **Key takeaway:** Community hierarchy is visible. Multiple layers of navigation (server → channel → thread). Real-time presence is central.

### LinkedIn (Professional Networking)
- **Mode:** Clean / minimal professional
- **Signature traits:** 2-column layout (feed + sidebar), professional blue accent, content cards with strong borders, "Who's viewed your profile" module, job listings integrated, messaging in bottom-right panel
- **Key takeaway:** Professional context matters. Clean and credible. Data density with restraint.

### Reddit (Community Forum)
- **Mode:** Community / threaded discussion
- **Signature traits:** Feed of compact cards (post title + community name + vote count + comment count), nested comment threads with indent lines, vote buttons (up/down arrows) left of content, community sidebar with rules and moderators, dark mode as default for many users
- **Key takeaway:** Content hierarchy is text-first, not image-first. Threaded discussions need clear visual nesting. Voting is the primary interaction.
