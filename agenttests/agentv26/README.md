# Build A Premium Airbnb-style

Build a premium Airbnb-style cabin rental marketplace. The app should have:

HOME SCREEN:
- A hero section with a large search input and location/date/guests filters
- A grid of cabin listings with photo thumbnails, location, price per night, rating, and host name
- A "Featured Cabins" section with 3 highlighted premium properties
- Quick filter chips for cabin types: "Lakefront", "Mountain", "For

**Concept:** Airbnb mood — A grounded system derived from Airbnb's visual language: restrained surfaces, one confident accent, and content doing the talking.

Built by Maxi Agent v25. 2 screens · 6 components.

## Run it

```bash
npm install
npm run dev
```

Requires Tailwind (the `src/styles.css` token sheet pairs with Tailwind utilities).

## Files

- `package.json`
- `src/App.jsx`
- `src/components/ActivityFeed.jsx`
- `src/components/Badge.jsx`
- `src/components/Button.jsx`
- `src/components/DetailPanel.jsx`
- `src/components/MetricCard.jsx`
- `src/components/RecordList.jsx`
- `src/data.js`
- `src/lib/shell.jsx`
- `src/screens/home.jsx`
- `src/styles.css`

## Data

All content renders from `src/data.js` (6 rows, 3 metrics) — swap it with your real data and every screen updates.

## Fonts

- Display: Plus Jakarta Sans
- Body: Plus Jakarta Sans
