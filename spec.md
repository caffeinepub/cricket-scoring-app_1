# Specification

## Summary
**Goal:** Fix broken page navigation and rendering so all tabs and pages load correctly after Version 11.

**Planned changes:**
- Audit and fix TanStack Router configuration in `App.tsx` to ensure all routes (Home/MatchHistory, Teams, MatchSetup, LiveScoring, Scorecard, Rules) are correctly defined and render their page components
- Fix page-level components (`Teams.tsx`, `MatchSetup.tsx`, `MatchHistory.tsx`, `LiveScoring.tsx`, `Scorecard.tsx`, `Rules.tsx`) to handle loading and error states gracefully, add missing default exports, and resolve any broken/circular imports
- Fix `useQueries.ts` to guard against calling actor methods before the actor is initialized, using enabled flags to prevent premature queries
- Audit `Layout.tsx` and `BottomTabNavigation.tsx` to ensure the `Outlet` is placed correctly and bottom tab links match the defined routes

**User-visible outcome:** All bottom navigation tabs open their respective pages without blank screens or crashes. Pages show a loading indicator while data is fetching and an error message if something goes wrong.
