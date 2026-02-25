# Specification

## Summary
**Goal:** Fix the stopped canister error that causes `getAllTeams` (and other backend queries) to fail, and improve frontend error handling so users see a friendly message instead of raw rejection text.

**Planned changes:**
- Review and fix `backend/main.mo` for any syntax errors, invalid stable variable declarations, or upgrade traps that are causing the canister to remain in a stopped state.
- Add graceful error handling on the Teams page (and any other page calling backend queries) to catch canister rejection errors (e.g., IC0508, reject code 5) and display a user-friendly message: "Unable to connect to the backend. Please try again later."
- Add a "Retry" button in the error state that re-triggers the failed backend query.
- Suppress raw rejection text from being shown to the user or thrown as unhandled JS errors.

**User-visible outcome:** When the backend canister is unavailable, users see a friendly error message with a retry button instead of a raw rejection error. Once the canister is fixed and deployed, `getAllTeams` and other queries return valid responses normally.
