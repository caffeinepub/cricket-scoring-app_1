# Specification

## Summary
**Goal:** Auto-end innings when the configured number of overs is completed, and fix the total score display in the Cricket Scorer app.

**Planned changes:**
- After each completed over, check if overs bowled equals the match's configured total overs; if so, automatically trigger end-of-innings logic.
- If the first innings ends automatically, show the `EndOfInningsModal` so the user can select openers and bowler for the second innings.
- If the second innings ends automatically, mark the match as complete and navigate to the scorecard/result screen.
- Fix the total score calculation in `ScoreDisplay` (and any other UI showing the innings total) to correctly sum all runs (including extras) from the deliveries array, updating in real time after each delivery.

**User-visible outcome:** The innings transitions automatically when all overs are bowled — moving to the second innings or ending the match without manual intervention — and the total score always shows the correct cumulative runs during live scoring.
