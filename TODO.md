# TODO

- [x] Root cause: `isomorphic-dompurify` pulls `jsdom/html-encoding-sniffer` which triggers the ESM/CJS crash under Turbopack SSR
- [x] Added `sanitize-html`
- [x] Replaced DOMPurify usage in `app/about/blog-news/page.tsx` and `app/about/blog-news/[slug]/page.tsx` with `sanitize-html`
- [x] Added local TS declaration for `sanitize-html` under `types/`
- [x] Verified Turbopack SSR in production for `/about/blog-news` — no ESM deps remain
- [x] Added `scripts/check-esm-deps.mjs` — fails CI if `isomorphic-dompurify`, `jsdom`, or `@exodus/bytes` re-enter the dep tree
- [x] Added `npm overrides` + `resolutions` for `@exodus/bytes` → CJS shim (safe range: any `@exodus/bytes-cjs-shim@*`)
- [x] Added `.github/workflows/ci.yml` — runs `next build` + smoke tests on every PR
- [x] Added `tests/smoke.mjs` — asserts HTTP 200 for `/about/blog-news`, `/office-bearers`, `/events`, `/gallery`


