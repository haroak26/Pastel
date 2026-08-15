# Agent v24 e2e — Run Summary (normal models)

| | |
|---|---|
| Run ID | `ad6fc0d8-fbd3-4b88-b4aa-80d1ca9504a6` |
| Status | `done_needs_review` |
| Product | A fitness tracking app that logs (A fitness tracking app) |
| Inspiration company | nike |
| Models | default routing — cheap `anthropic/claude-haiku-4-5` (plan/genome/clarify/planner/builder/compose/data/assemble) + mid `openai/gpt-5.6-luna` (design/brief/copy/review/visualReview/repair) |
| Thinking | disabled (default) |
| Wall time | 320.24s |
| Screens (verified) | detail, home |
| Failed screens | none |
| Quality | passed=false · score=58 · repairs=1 |

## Wave timing (s)
| Wave | Seconds |
|---|---|
| w0 | 23.8 |
| w1 | 21.9 |
| w2 | 116.7 |
| w3 | 37 |
| w4 | 118.3 |
| **Σ waves** | **317.7** |
| **Wall** | **320.24** |

## Model calls by role
| Role | Calls |
|---|---|
| builder | 14 |
| repair | 6 |
| builderCustom | 5 |
| genome | 4 |
| planner | 4 |
| plan | 2 |
| copy | 2 |
| data | 2 |
| compose | 2 |
| review | 2 |
| **Total** | **43** |

## Knowledge-base slices
- wave1-genome: 41247 chars

## Gate / fidelity / props / review
- Gate: 0/100 — FAIL (14 issues)
- Fidelity: 7/8 passed · 1 hard failures
- Prop contract: 0 violations after auto-fix
- Review: 58/100 — RETURN_TO_BUILDER

## Screenshots
- `screenshots/detail-desktop.png`
- `screenshots/detail-mobile.png`
- `screenshots/home-desktop.png`
- `screenshots/home-mobile.png`
