# Specification

## Summary
**Goal:** Add bulk player name upload to the Teams page and retheme the entire app to a professional blue and orange color scheme.

**Planned changes:**
- Add a "Bulk Add Players" section on the Teams page allowing users to paste newline- or comma-separated player names into a textarea, or upload a `.txt`/`.csv` file
- Show a parsed name preview before confirming the bulk add
- Validate each parsed name (non-empty, no duplicates, 11-player team limit) and display a post-add summary of added vs. skipped names with reasons
- Reuse existing `addPlayer` backend calls for all bulk additions
- Retheme the entire app from cricket-green/cream to deep navy/dark blue backgrounds and bold orange accents
- Update Tailwind config color tokens and CSS custom properties to drive the new blue/orange palette globally
- Apply new palette consistently across all pages and components: Teams, BottomTabNavigation, Layout header, scoring dashboard, scorecard, match history, match setup, rules page, and all modals
- Refine typography, card borders, shadows, and section hierarchy for a more professional, polished look

**User-visible outcome:** Users can bulk-add players to a team by pasting or uploading a name list, with validation and a clear summary. The entire app now displays a professional deep navy and bold orange theme with clean, polished UI across all pages and modals.
