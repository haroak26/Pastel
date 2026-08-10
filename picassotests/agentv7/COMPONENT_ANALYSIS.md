# Component Analysis — Did the agent modify the base components? (agentv7)

**Run:** `e2e-1-1786397271062` · **23 generated components** from **14 distinct base sources**
(`server/lib/pastel-agent/picasso/base-components/ui/`).

**Bottom line: the agent modified every base component.** Nothing is byte-identical to its base.
Customization depth varies by taxonomy exactly as the V7 divergence bar intends: primitives stay
close to base (correct — generic chrome), molecules/organisms diverge (correct — they carry the
product's identity).

## Verdict legend
- **NEAR-BASE / lightly customized** — structure, exports and API preserved; slots/tokens swapped, density/sizing tuned
- **moderately customized** — visible re-architecture (new sub-components, layouts)
- **substantially rewritten** — new implementation over the same API

## Per-component comparison (same chunk-similarity metric the anti-slop gate uses)

| Component | Base | Taxonomy | Similarity | Verdict | gen/base lines |
|---|---|---|---|---|---|
| habit-save-button | button | primitive | 92% | NEAR-BASE (permitted for primitives) | 67/68 |
| setting-row | item | molecule | 90% | lightly customized (at gate edge) | 199/197 |
| add-habit-button | button | primitive | 89% | lightly customized | 68/68 |
| week-start-select | native-select | primitive | 89% | lightly customized | 61/62 |
| habit-dialog | dialog | organism | 87% | lightly customized | 167/169 |
| date-heading | label | atom | 84% | lightly customized | 23/23 |
| habit-empty | empty | organism | 83% | lightly customized | 104/105 |
| settings-title | label | atom | 83% | lightly customized | 23/23 |
| settings-trigger | button | atom | 83% | lightly customized | 67/68 |
| ledger-table | table | organism | 82% | lightly customized | 114/115 |
| habit-row-menu | dropdown-menu | molecule | 81% | lightly customized | 313/270 |
| save-settings-button | button | primitive | 78% | lightly customized | 67/68 |
| app-mark | button | atom | 75% | lightly customized (+ product sub-components) | 98/68 |
| habit-item | item | molecule | 71% | lightly customized (+ HabitRow, variants) | 249/197 |
| empty-ledger | empty | organism | 71% | lightly customized (+ EmptyMedia etc.) | 120/105 |
| primary-nav | button-group | molecule | 62% | moderately customized (+ LedgerSwitch) | 129/84 |
| week-strip | button-group | molecule | 60% | moderately customized (+ WeekStrip) | 138/84 |
| habit-list | card | organism | 57% | moderately customized | 109/104 |
| completion-status | badge | atom | 54% | moderately customized (+ DailyProgressChip) | 94/50 |
| habit-schedule | button-group | molecule | 52% | moderately customized (+ HabitDaysToggle) | 128/84 |
| habit-checkbox | checkbox | primitive | 43% | substantially rewritten | 34/32 |
| habit-name-input | input | primitive | 31% | substantially rewritten (value/onChange API) | 32/20 |
| reminder-switch | switch | primitive | 22% | substantially rewritten | 29/34 |

**Averages:** mean similarity **70%** · near-base (≥90%): **1** · moderately+ (52–62%): **5** ·
substantially rewritten (<50%): **3**

## How the agent customized (typical diff pattern)
- **Token swaps:** `bg-primary`/`text-muted-foreground`/`border-input` substituted for base colors; raw
  `h-9`/`rounded-md` replaced by `h-[var(--control-*)]`/`rounded-[var(--radius-*)]` per the design law.
- **Density/radius/state discipline:** hover/focus-visible rings, active + disabled states preserved or
  strengthened; radii moved to the theme scale.
- **API preserved:** all base exports kept (verified by the pipeline's export-preservation check — the
  only retried failures were `Missing exports from base: Button, buttonVariants` on first attempts,
  which the retry fixed). Product additions (e.g. `LedgerSwitch`, `WeekStrip`, `HabitRow`,
  `DailyProgressChip`) are appended as new named exports.
- **Reuse of base siblings:** several components kept the base's relative imports (`./separator` from
  `button-group`). This is what triggered the missing-`separator` bundle failure — the agent faithfully
  inherited the base's import graph, but the manifest never provisioned that module (see DIAGNOSIS.md #6).

## Verdict
The agent **did modify** the components — no component was left as-is. Quality of modification is
consistent with the system prompt's "START from the base, change what the customization demands"
contract: primitives hover at 78–92% similarity (they should look like buttons/inputs), while the
product's identity-bearing molecules/organisms diverge to 52–87%. The single near-base component
(`habit-save-button`, 92%, primitive) is within the pipeline's allowed band and triggered no gate
violation. The main defect found is not similarity but **import-graph incompleteness** — inheriting
base imports without the corresponding manifest entries.
