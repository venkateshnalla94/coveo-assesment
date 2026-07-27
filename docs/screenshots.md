# UI Screenshots

Reference screenshots of every documented page and interaction state, captured against a live Coveo org (Headless Commerce, RGA, trending content, and the Conversational Search Agent all enabled). Regenerate with:

```
npm run docs:screenshots
```

This requires a dev server already running at `http://localhost:3000` (`npm run dev`) and a working `.env.local`. The capture script lives at [scripts/capture-screenshots.mjs](../scripts/capture-screenshots.mjs) and writes PNGs into `docs/screenshots/`.

## Home — empty search

![Home page with empty search](screenshots/01-home-empty-search.png)

## Search suggestions

![Search suggestions dropdown](screenshots/02-search-suggestions.png)

## Catalog page

![Catalog page with results](screenshots/03-catalog-results.png)

## Generative Answer

![Generative answer banner](screenshots/04-generative-answer.png)

## Facets toggle

![Active facet filter applied](screenshots/05-facets-toggle.png)

## Blog

Index:

![Blog index](screenshots/06-blog-index.png)

Detail:

![Blog article detail](screenshots/06-blog-detail.png)

## Trending Content

![Trending / related technical resources rail](screenshots/07-trending-content.png)

## Quick View

![Quick view product drawer](screenshots/08-quick-view.png)

## Compare Products

![Compare products dialog](screenshots/09-compare-products.png)

## Chat bot opened

![Conversational search assistant panel opened](screenshots/10-chatbot-opened.png)
