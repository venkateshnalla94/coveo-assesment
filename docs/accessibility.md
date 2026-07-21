# Accessibility

## Automated Checks

Accessibility automation uses `@axe-core/playwright` in `tests/e2e/accessibility.spec.ts`.

The checks fail on serious and critical violations only. This keeps the gate meaningful without blocking on lower-priority advisory findings during the assessment.

Validated states:

- Default page.
- Search suggestions open.
- Results displayed.
- Facets displayed.
- Zero results.
- Generative answer.
- Technical resources.
- Minimal profile.

No rule is disabled globally. If a future rule needs an exception, scope it to the smallest selector and document the reason in the test.

## Keyboard Behavior

Keyboard coverage verifies:

- The search input receives focus after hydration.
- Arrow keys navigate suggestions.
- Enter submits the highlighted suggestion or current query.
- Escape closes suggestions.
- Facet controls are reachable and toggle by keyboard.
- Sorting is focusable and updates the result state.
- Pagination controls are reachable and update active page state.
- Generative citations and feedback controls are keyboard reachable.
- Retry actions are reachable.
- Focus is not trapped after major state changes.

## Layout and Announcements

Search results, generative answers, and trending content use stable skeleton dimensions to reduce layout shift. Loading regions use status semantics and polite announcements where appropriate.

The responsive E2E suite checks that search, suggestions, facets, results, generated answers, trending content, pagination, header, and footer remain usable without horizontal overflow at supported viewports.

## Known Limitations

The app does not yet run a manual screen-reader pass against real Coveo data. Live Headless controller states are covered indirectly through existing component structure and credential-free safety checks.
