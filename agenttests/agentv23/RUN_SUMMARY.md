# Agent v23 e2e — Run Summary (normal models)

| | |
|---|---|
| Run ID | `0d1c72e7-2a7f-4de2-a22f-ea1d8c428263` |
| Status | `done_needs_review` |
| Product | A fitness tracking app that logs (A fitness tracking app) |
| Inspiration company | nike |
| Models | default routing — cheap `anthropic/claude-haiku-4-5` (plan/genome/clarify/planner/builder/compose/data/assemble) + mid `openai/gpt-5.6-luna` (design/brief/copy/review/visualReview/repair) |
| Thinking | disabled (default) |
| Wall time | 375.08s |
| Screens (verified) | detail, home |
| Failed screens | none |
| Quality | passed=false · score=62 · repairs=1 |

## Wave timing (s)
| Wave | Seconds |
|---|---|
| w0 | 51.1 |
| w1 | 19.8 |
| w2 | 131.6 |
| w3 | 13.7 |

## Model calls by role
| Role | Calls |
|---|---|
| builder | 12 |
| repair | 7 |
| planner | 4 |
| builderCustom | 3 |
| plan | 2 |
| genome | 2 |
| copy | 2 |
| data | 2 |
| compose | 2 |
| review | 2 |
| **Total** | **38** |

## Knowledge-base slices
- wave1-genome: 41247 chars

## Gate / fidelity / props / review
- Gate: 0/100 — FAIL (29 issues)
- Fidelity: 9/10 passed · 1 hard failures
- Prop contract: 0 violations after auto-fix
- Review: 62/100 — RETURN_TO_BUILDER

## Screenshots
- `screenshots/detail-desktop.png`
- `screenshots/detail-mobile.png`
- `screenshots/home-desktop.png`
- `screenshots/home-mobile.png`
