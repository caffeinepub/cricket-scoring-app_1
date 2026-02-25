# Specification

## Summary
**Goal:** Diagnose and fix the broken scoring functionality in the LiveScoring page so that all delivery types are recorded correctly.

**Planned changes:**
- Fix delivery recording in `LiveScoring.tsx` so that normal runs (0–6), wides, no-balls, byes, leg-byes, and wickets all update the score, ball count, and over count correctly.
- Ensure wides and no-balls add the correct run penalty without advancing the legal ball count.
- Ensure wicket recording decrements the wicket count and triggers the WicketModal for batsman selection.
- Ensure the EndOfOverModal appears exactly once after 6 legal deliveries without reintroducing the infinite bowler-selection loop from Version 20.
- Ensure score updates are immediately reflected in ScoreDisplay, BatsmanStatsPanel, and BowlerStatsPanel.
- Ensure match state is persisted to localStorage and the backend after each delivery.

**User-visible outcome:** Users can record all delivery types on the scoring pad and see scores, ball counts, and over counts update correctly without errors or modal loops.
