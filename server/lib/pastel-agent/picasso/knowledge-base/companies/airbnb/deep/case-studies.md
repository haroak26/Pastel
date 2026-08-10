# Airbnb Case Studies — Deep Reference

## Screen 1: Homepage

### Purpose
Inspire travel discovery. The homepage is a travel inspiration engine, not just a search tool. It should make you want to go somewhere, even if you didn't plan to travel.

### Layout (Desktop)

```
+------------------------------------------------------------------+
| [Logo]        [Stays] [Experiences] [Online]     [Host] [🌐] [👤] |
+------------------------------------------------------------------+
|                                                                    |
|                                                                    |
|                    "Not sure where to go?"                        |
|                        Perfect.                                    |
|                                                                    |
|              +------------------------------------+               |
|              |  Where to? | Check in | Check out | Who? | [🔍]    |
|              +------------------------------------+               |
|                                                                    |
|                    [I'm Flexible] button                          |
|                                                                    |
+------------------------------------------------------------------+
|  [Amazing pools] [Beachfront] [Cabins] [Arctic] [Islands] ...    |
+------------------------------------------------------------------+
|  Inspiration for your next trip                                   |
|  +----------+ +----------+ +----------+ +----------+               |
|  |   PHOTO   | |   PHOTO   | |   PHOTO   | |   PHOTO   |          |
|  |           | |           | |           | |           |          |
|  | Location  | | Location  | | Location  | | Location  |          |
|  | Distance  | | Distance  | | Distance  | | Distance  |          |
|  +----------+ +----------+ +----------+ +----------+               |
+------------------------------------------------------------------+
|  Shop Airbnb presents                                              |
|  [Wishlist-worthy stays] - Single wide card with large photo       |
+------------------------------------------------------------------+
|  Experiences                                                       |
|  +------------+  +------------+  +------------+  +------------+    |
|  |    PHOTO    |  |    PHOTO    |  |    PHOTO    |  |    PHOTO    | |
|  | Title       |  | Title       |  | Title       |  | Title       | |
|  | From $25    |  | From $30    |  | From $40    |  | From $20    | |
|  +------------+  +------------+  +------------+  +------------+    |
+------------------------------------------------------------------+
|  [Footer: Links, Social, Legal, Language selector, Currency]      |
+------------------------------------------------------------------+
```

### Key Interactions
1. **Hero image**: Cycles through curated destination photos. Subtle parallax on scroll.
2. **Search bar**: Click expands to multi-input (Where, Check in, Check out, Who). Calendar pops below, guest counter slides in.
3. **"I'm Flexible"**: Opens date-flexible browse mode — shows "this month," "next month," "this year" options.
4. **Category tabs**: Horizontally scrollable pill-shaped tabs. Each has an icon + label. Selecting scrolls down to matching section or navigates to search.
5. **Inspiration cards**: Click navigates to search results pre-filtered to that location.
6. **Experiences cards**: Similar to listing cards but focused on activities. Different card ratio (more square for activity photos).

### Design Notes
- Photography is the primary content. Text is supportive only.
- Coral is limited to: search button, hearts, category tab active state, and badges. That's it.
- White space is intentionally generous — the page breathes.
- Each section has 64px margin above and below.
- The page feels organic and editorial, not structured like a database.

---

## Screen 2: Search Results

### Purpose
Help users browse, filter, and discover listings that match their criteria. Balance between visual browsing (cards) and spatial context (map).

### Layout

```
+------------------------------------------------------------------+
| [← Back]  [Filter bar: Date · Guests · Price · Type · More...]    |
+------------------------------------------------------------------+
|                                             |                     |
|  [Previous] "Showing 300+ places" [Next]    |                     |
|                                             |                     |
|  +----------+ +----------+ +----------+     |    +-----------+    |
|  |   PHOTO   | |   PHOTO   | |   PHOTO   |   |    |           |    |
|  |           | |           | |           |   |    |    MAP    |    |
|  | Title     | | Title     | | Title     |   |    |           |    |
|  | Details   | | Details   | | Details   |   |    |  $125    |    |
|  | ★ 4.92   | | ★ 4.85   | | ★ 4.91   |   |    |  $200    |    |
|  | $125/nt  | | $200/nt  | | $150/nt  |   |    |  $150    |    |
|  +----------+ +----------+ +----------+     |    |           |    |
|                                             |    |           |    |
|  +----------+ +----------+ +----------+     |    +-----------+    |
|  |   PHOTO   | |   PHOTO   | |   PHOTO   |   |                     |
|  |           | |           | |           |   |  [Map] [List]      |
|  | Title     | | Title     | | Title     |   |                     |
|  +----------+ +----------+ +----------+     |                     |
|                                             |                     |
+------------------------------------------------------------------+
```

### Layout Notes
- Desktop split: 60% cards (left), 40% map (right)
- Tablet: toggle between full-width cards and full-width map
- Mobile: cards default, map available via toggle button
- Map/list toggle button floats at bottom-center as a pill

### Filter Bar

```
[Price range ▼] [Type of place ▼] [Rooms and beds ▼] [Amenities ▼] [More filters...]
```

- Horizontal scrollable filter pills
- Price range opens a dual-thumb slider with histogram showing available listings at each price point
- Active filters show count badge on "More filters" button
- "Clear all" link appears when any filter is active

### Map Behavior
- Pins show price (e.g., "$125" inside a white pill)
- Selected pin shows mini listing card (photo + title + rating + price + "View" link)
- Map recenters on scroll through card list, and vice versa
- Zoom in to see individual pins; zoom out for area clusters with count

### Listing Card (Search Results Variant)
- Same as design system spec
- Additional: pinned "Guest favorite" badge, "New" badge, "Superhost" badge on photo
- Carousel arrows on photo (hide until hover on desktop, always visible on mobile)
- Heart icon top-right for saving to wishlist
- Price shown without taxes/cleaning fees until booking flow

### Interaction Flow
1. User browses cards and map simultaneously
2. Hover/clicks card highlights corresponding pin on map
3. Clicks pin to see preview card
4. Clicks "View" on preview → navigates to listing detail
5. Uses filters to narrow results (dynamic updates, no page reload)
6. Drags map to search new area ("Search as I move the map" label appears)

---

## Screen 3: Listing Detail

### Purpose
Provide complete information about a listing to build confidence and drive booking. Combination of aspirational photography and practical details.

### Layout

```
+------------------------------------------------------------------+
|                           [← Back]                         [❤] [↗] |
+------------------------------------------------------------------+
|                                                                   |
|  +------+ +------+ +------+ +------+ +------+   [Show all photos]|
|  | PHOTO | | PHOTO | | PHOTO | | PHOTO | | PHOTO |                |
|  |   1   | |   2   | |   3   | |   4   | |   5   |                |
|  +------+ +------+ +------+ +------+ +------+                    |
|                                                                   |
+------------------------------------------------------------------+
|  Entire cabin in Big Bear Lake, CA                                |
|  4 guests · 2 bedrooms · 3 beds · 1 bath                         |
|  ★ 4.92 · 128 reviews · Superhost badge                           |
+------------------------------------------------------------------+
|                                         |  +--------------------+ |
|                                         |  |  $125 / night      | |
|                                         |  |  ★ 4.92 · 128 rev  | |
|                                         |  |  [Check in] [Out]  | |
|                                         |  |  [Guests selector]  | |
|                                         |  |  +----------------+ | |
|                                         |  |  |    Reserve     | | |
|                                         |  |  +----------------+ | |
|                                         |  |  You won't be       | |
|                                         |  |  charged yet        | |
|                                         |  +--------------------+ | |
|  +--+                                                                |
|  |  | Hosted by Sarah                                               |
|  +--+ Superhost · 3 years hosting                                   |
|      98% response rate                                              |
+------------------------------------------------------------------+
|  [Divider]                                                         |
|  ★ 4.92 · 128 reviews                                              |
|  ★★★★★ Great place! Beautiful views...                             |
|  ★★★★★ Sarah was an amazing host...                                |
|  [Show all 128 reviews]                                            |
+------------------------------------------------------------------+
|  Where you'll be                                                   |
|  Big Bear Lake, California, United States                          |
|  [Mini map showing neighborhood location]                           |
+------------------------------------------------------------------+
|  What this place offers                                             |
|  [Kitchen icon] [WiFi icon] [Parking icon] [Pool icon]              |
|  [TV icon] [AC icon] [Washer icon] [Heating icon]                  |
|  24 amenities · [Show all amenities]                               |
+------------------------------------------------------------------+
|  Things to know                                                     |
|  House rules · Check-in 3:00 PM · Checkout 11:00 AM                |
|  Health & safety · Carbon monoxide alarm · Smoke alarm             |
|  Cancellation policy · Free cancellation before [date]             |
+------------------------------------------------------------------+
```

### Key Design Decisions

**Photo Gallery (top section)**
- Grid layout: 2 large left + 2 stacked right + 1 more on desktop; horizontal scroll on mobile
- "Show all photos" button overlay with grid icon
- Photos are warm, well-lit, showing the space at its best
- No text overlays on photos except the gallery button

**Booking Card (sticky on desktop, inline on mobile)**
- White card with shadow-elevated
- Sticky: follows scroll, stays visible in right sidebar
- Contents: price/night, star rating, date inputs, guest selector, Reserve button, price note
- Reserve button: full-width, coral, 48px height
- "You won't be charged yet" in small warm gray text beneath — builds trust

**Host Section**
- Host avatar (56px, circular)
- Name + Superhost badge if applicable
- Years hosting, response rate, response time
- Small stats — builds trust through transparency
- "Contact host" link

**Reviews Section**
- Aggregate rating at top (large, bold: ★ 4.92)
- Bar chart showing distribution of 1-5 star ratings
- Individual review cards (as specified in design system)
- Keyword highlights: "clean," "view," "location" with counts

**Amenities Grid**
- Icon + label per amenity
- 4 columns on desktop, 2 on mobile
- Popular amenities shown first (WiFi, Kitchen, Parking)
- "Show all amenities" opens a modal with full categorized list

**Map Section**
- Static map image (not interactive — click opens full map)
- Shows approximate neighborhood location (not exact address for privacy)
- "Show exact location after booking" note

### Interaction Flow
1. User arrives from search results card or direct link
2. Browses photos (carousel on mobile, grid on desktop)
3. Scrolls down to read details, reviews, amenities
4. Booking card stays visible (sticky) — user can book at any point
5. Selecting dates in booking card → dynamic price calculation
6. Clicking Reserve → transitions to booking flow

---

## Screen 4: Booking Flow

### Purpose
Convert interest into a confirmed reservation. The flow must feel guided, secure, and transparent. No surprises at the end.

### Steps (Progressive)

**Step 1: Date Selection**
```
+--------------------------------------------------------+
|  [← Back to listing]                                   |
|                                                        |
|  Select check-in date                                  |
|  +------------------------+  +------------------------+ |
|  |   September 2026       |  |   October 2026         | |
|  | Su Mo Tu We Th Fr Sa   |  | Su Mo Tu We Th Fr Sa   | |
|  |        1  2  3  4  5   |  |             1  2  3    | |
|  |  6  7  8  9 10 11 12   |  |  4  5  6  7  8  9 10  | |
|  | 13 14 [15][16]17 18 19  |  | 11 12 13 14 15 16 17  | |
|  | 20 21 22 23 24 25 26   |  | 18 19 20 21 22 23 24  | |
|  | 27 28 29 30            |  | 25 26 27 28 29 30 31  | |
|  +------------------------+  +------------------------+ |
|                                                        |
|  [Clear dates]                                         |
+--------------------------------------------------------+
```
- Two-month side-by-side calendar (desktop), single month scrollable (mobile)
- Selected date range highlighted in coral-light (#FFF2F2) with start/end circles in coral
- Dates before today: grayed out and disabled
- Weekend dates: subtle background tint
- If user arrived with dates, pre-selected
- Bottom: "Clear dates" link in warm gray

**Step 2: Guest Selection**
```
+--------------------------------------------------------+
|                                                        |
|  Guests                                                |
|                                                        |
|  Adults                       [-]  2  [+]              |
|  Children (ages 2-12)         [-]  0  [+]              |
|  Infants (under 2)            [-]  0  [+]              |
|  Pets                         [-]  0  [+]              |
|                                                        |
+--------------------------------------------------------+
```
- Stepper controls with +/- buttons
- Min/max limits based on listing capacity
- Error state: "This place can host up to X guests"
- Brief copy: "Bringing a service animal?" with info link

**Step 3: Price Breakdown**
```
+--------------------------------------------------------+
|                                                        |
|  Price details                                         |
|                                                        |
|  $125.00 x 5 nights            $625.00                 |
|  Cleaning fee                   $85.00                 |
|  Airbnb service fee             $88.75                 |
|  ─────────────────────────────────────                 |
|  Total                          $798.75                |
|                                                        |
|  [Confirm and pay]                                     |
|                                                        |
|  By selecting the button below, I agree to the         |
|  Host's House Rules, Ground rules for guests,          |
|  Airbnb's Rebooking and Refund Policy...               |
+--------------------------------------------------------+
```
- Transparent line-item breakdown — no hidden fees
- Total in bold at bottom with horizontal rule separator
- Agreement text in warm gray (12px)
- "Confirm and pay" button: full-width, coral, 56px height (larger than other buttons — this is THE action)

**Step 4: Payment**
```
+--------------------------------------------------------+
|                                                        |
|  Confirm and pay                                       |
|                                                        |
|  +--------------------------------------------------+  |
|  |  Pay with                                [Visa]  |  |
|  |  **** **** **** 4242                              |  |
|  +--------------------------------------------------+  |
|                                                        |
|  [Add payment method]                                  |
|                                                        |
|  Cancellation policy                                   |
|  Free cancellation until [date]. After that, cancel    |
|  before [date] for a 50% refund.                       |
|  [Read full policy]                                    |
|                                                        |
|  [✓] Send me a message about my trip                   |
|                                                        |
|  +--------------------------------------------------+  |
|  |              Confirm and pay                     |  |
|  +--------------------------------------------------+  |
+--------------------------------------------------------+
```
- Saved payment methods displayed as cards
- Cancellation policy prominently displayed (trust = conversion)
- Email opt-in checkbox (unchecked by default)
- Confirm button repeats as bottom-anchored CTA

**Step 5: Confirmation + Host Message**
```
+--------------------------------------------------------+
|                    ✓ Confirmed!                         |
|                                                        |
|  Your trip to Big Bear Lake is booked.                 |
|  Check-in: September 15, 2026                          |
|  Checkout: September 20, 2026                          |
|                                                        |
|  Say hello to your host                                |
|  +--------------------------------------------------+  |
|  |                                                  |  |
|  |  Hi Sarah! Excited to stay at your cabin.         |  |
|  |  Anything I should know before arriving?          |  |
|  |                                                  |  |
|  +--------------------------------------------------+  |
|                                                        |
|  [Send message]                                        |
|                                                        |
|  [View trip details →]                                 |
+--------------------------------------------------------+
```
- Confirmation checkmark (coral, animated entrance)
- Trip details summarized clearly
- Host message prompt — encourages human connection
- "View trip details" link to the Trips section

### Design Principles for Booking Flow
- Never hide fees — transparency builds trust and reduces abandonment
- Show cancellation policy BEFORE payment — no one likes surprises
- Each step has a clear, singular CTA
- Progress indicators: subtle breadcrumb or step indicator
- Back navigation always available (never feel trapped)
- Host message after confirmation — reinforces the human connection

---

## Screen 5: Trips / Inbox

### Purpose
Central hub for upcoming and past reservations, host messages, and trip itinerary information.

### Layout (Trips Overview)

```
+------------------------------------------------------------------+
|  Trips                                                           |
+------------------------------------------------------------------+
|  [Upcoming]  [Past]  [Cancelled]                                 |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |  Big Bear Lake, CA                   September 15-20, 2026   | |
|  |  +-----+                                                      | |
|  |  | PHOTO|  Hosted by Sarah                                    | |
|  |  +-----+  Check-in 3:00 PM                                    | |
|  |           1 trip saved to calendar                            | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |  Tokyo, Japan                        October 10-20, 2026     | |
|  |  +-----+                                                      | |
|  |  | PHOTO|  2 trips saved                                      | |
|  |  +-----+  Reservation confirmed                               | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### Trip Card (List Item)
```
+--------------------------------------------------------------+
|  [Photo thumbnail 80x80px]   Destination Name                |
|                              Dates (Month DD-YYYY)           |
|                              Hosted by [Name]                 |
|                              Check-in time                    |
|                              [View itinerary →]               |
+--------------------------------------------------------------+
```
- Photo thumbnail: 80x80px, rounded 12px
- Title: destination name, 18px Medium
- Dates: 14px Book, warm gray
- Host info: 14px Book
- Divider between trips
- Tap → full itinerary view

### Itinerary Detail View

```
+------------------------------------------------------------------+
|  [← Back]                                       [Share] [More ...]|
+------------------------------------------------------------------+
|  [Large listing photo - 16:9, rounded 12px]                      |
|                                                                   |
|  Big Bear Lake, CA                                                |
|  Entire cabin · September 15-20 · 4 guests                       |
+------------------------------------------------------------------+
|  Getting there                                                     |
|  +--------------------------------------------------------------+ |
|  |  Check-in address                                              | |
|  |  123 Pine Road, Big Bear Lake, CA 92315                        | |
|  |  [Get directions]                                              | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
|  Your Host                                                        |
|  +--+                                                             |
|  |  | Sarah                                                       |
|  +--+ Joined 2018 · 98% response rate                             |
|      [Message host]                                               |
+------------------------------------------------------------------+
|  House rules                                                      |
|  • Check-in: After 3:00 PM                                        |
|  • Checkout: 11:00 AM                                            |
|  • No smoking · No parties · Pets allowed                         |
+------------------------------------------------------------------+
|  Cancellation policy                                              |
|  Free cancellation before September 10...                         |
+------------------------------------------------------------------+
```

### Inbox / Messages

```
+------------------------------------------------------------------+
|  Messages                                                         |
|  [Hosts] [Support] [All]                                         |
+------------------------------------------------------------------+
|  +--+                                                             |
|  |  | Sarah                                    Yesterday          |
|  +--+ "Great! Let me know if you need anything..."                |
|  +--+                                                             |
|  |  | Airbnb Support                            3 days ago        |
|  +--+ "Your reservation is confirmed..."                          |
+------------------------------------------------------------------+
```

### Message Thread View
```
+------------------------------------------------------------------+
|  [← Back]                               Sarah · Host              |
+------------------------------------------------------------------+
|                                              +-------------+     |
|                           "Hi Sarah! Excited |  You         |     |
|                            to stay at your   +-------------+     |
|                            cabin."                               |
|                                                                   |
|  +-------------+                                                  |
|  | Sarah       | "Thanks! The door code is 4521.                  |
|  +-------------+  Let me know if you need                           |
|                   anything during your stay :)"                    |
|                                                                   |
+------------------------------------------------------------------+
|  +---------------------+                         [Send]           |
|  | Type a message...   |                                          |
|  +---------------------+                                          |
+------------------------------------------------------------------+
```
- Message bubbles: 16px border-radius, 12px padding
- User messages: coral-light (#FFF2F2) background, right-aligned
- Host/support messages: white background with border, left-aligned
- Timestamps: 12px warm gray above message clusters
- Input bar: fixed to bottom, rounded 24px, 48px height
- Send button: coral, shown when text is present
