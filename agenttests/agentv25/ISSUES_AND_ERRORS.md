# Agent v25 e2e — Issues & Errors

Run: `6e23bdc2-4632-4a00-94ce-94c21b4292ce` · brief: A running tracker for competitive runners that logs sessions and shows coach-grade pace metrics · wall: 85.9s · models: default

## Fatal error

No screens verified — every screen failed to author or bundle. Check the builder output.
## Gate issues (7)

1. [medium] anti-slop — src/components/DetailPanel.jsx: Slop pattern classes: text-6xl. Section padding comes from the 8px ladder (py-8/py-12, bands py-16); type maxes at text-4xl.

2. [medium] anti-slop — src/components/MetricCard.jsx: Slop pattern classes: text-6xl, text-7xl. Section padding comes from the 8px ladder (py-8/py-12, bands py-16); type maxes at text-4xl.

3. [high] state — src/screens/detail.jsx: Runtime failure: No matching export in "maxi:maxi:src/components/Button.jsx" for import "Button"

4. [high] state — src/screens/detail.jsx: Runtime failure: No matching export in "maxi:maxi:src/components/Badge.jsx" for import "Badge"

5. [high] state — src/screens/detail.jsx: Runtime failure: No matching export in "maxi:maxi:src/components/DetailPanel.jsx" for import "DetailPanel"

6. [high] state — src/screens/detail.jsx: Runtime failure: No matching export in "maxi:maxi:src/components/ActivityFeed.jsx" for import "ActivityFeed"

7. [high] state — src/components/MetricCard.jsx: Runtime failure: Expected ";" but found "MetricCardProps"


## Anomalies (console)
```
[maxi-agent] direction call failed, using deterministic fallback: [
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      0,
      "props",
      0,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      0,
      "props",
      1,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      0,
      "props",
      2,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      0,
      "props",
      3,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      0,
      "props",
      4,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      1,
      "props",
      0,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      1,
      "props",
      1,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      1,
      "props",
      2,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      2,
      "props",
      0,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      2,
      "props",
      1,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      2,
      "props",
      2,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      2,
      "props",
      3,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      3,
      "props",
      0,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      3,
      "props",
      1,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      3,
      "props",
      2,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      3,
      "props",
      3,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      4,
      "props",
      0,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      4,
      "props",
      1,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      4,
      "props",
      2,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      4,
      "props",
      3,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      4,
      "props",
      4,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      5,
      "props",
      0,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      5,
      "props",
      1,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      5,
      "props",
      2,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      6,
      "props",
      0,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      6,
      "props",
      1,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      6,
      "props",
      2,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      6,
      "props",
      3,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      6,
      "props",
      4,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      7,
      "props",
      0,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      7,
      "props",
      1,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      7,
      "props",
      2,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      7,
      "props",
      3,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      8,
      "props",
      0,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      8,
      "props",
      1,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      8,
      "props",
      2,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      9,
      "props",
      0,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      9,
      "props",
      1,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      9,
      "props",
      2,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      9,
      "props",
      3,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      10,
      "props",
      0,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      10,
      "props",
      1,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "componentManifest",
      10,
      "props",
      2,
      "required"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "null",
    "path": [
      "dataSchema",
      "currency"
    ],
    "message": "Expected string, received null"
  }
]

```