# Submission Checklist

## Repository

- [ ] Git status is clean.
- [ ] `.env.local` is not committed.
- [ ] No credential values are committed.
- [ ] No temporary files are committed.
- [ ] No obsolete generic demo files remain.
- [ ] README is current and reviewer-ready.

## Validation

- [ ] `npm run format:check`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run test:coverage`
- [ ] `npm run build`
- [ ] `npm run test:e2e`
- [ ] `npm run validate`
- [ ] `npm run secrets:scan`
- [ ] `npm audit`

## Live Demo

- [ ] Search entry page loads directly.
- [ ] Popular search links navigate to `/catalog`.
- [ ] `/catalog` loads directly.
- [ ] `welding arm` query works.
- [ ] Suggestions appear.
- [ ] All five facets work.
- [ ] Pagination works.
- [ ] Comparison works.
- [ ] Product details open and close.
- [ ] RGA appears or fails independently.
- [ ] Technical Resources appear or fail independently.
- [ ] Clicking a Technical Resources card opens `/blog/[id]` with the full article and a working "View original source" link; an unknown id renders the 404 page.
- [ ] If `COVEO_FEATURE_CONVERSATION_ENABLED=true`, the floating conversational agent widget opens on every page and answers or fails independently; if unset, confirm the widget stays hidden.
- [ ] Mobile layout is usable.
- [ ] Keyboard-only navigation is usable.

## Submission

- [ ] Repository or archive is prepared.
- [ ] Setup instructions are verified from a clean install.
- [ ] Project is submitted 24 hours before the interview.
- [ ] Backup local copy is available.
- [ ] Fallback demo recording or screenshots are available.
- [ ] Presentation URLs are bookmarked.
