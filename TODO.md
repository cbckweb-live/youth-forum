# TODO

- [x] Root cause: `isomorphic-dompurify` pulls `jsdom/html-encoding-sniffer` which triggers the ESM/CJS crash under Turbopack SSR
- [x] Added `sanitize-html`
- [x] Replaced DOMPurify usage in `app/about/blog-news/page.tsx` and `app/about/blog-news/[slug]/page.tsx` with `sanitize-html`
- [x] Added local TS declaration for `sanitize-html` under `types/`
- [ ] Verify Turbopack SSR in production for `/about/blog-news`


