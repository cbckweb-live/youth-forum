# TODO

- [x] Update `community-site/app/page.tsx` to add two new homepage sections after `HeroSlider`:
  - [x] Upcoming Events (show exactly 2 upcoming events; include events spanning full month)
  - [x] Recent Blog & News (show recent published posts; truncate content to a few lines and add “Read more” links)

- [x] Run lint/build in `community-site/`
- [ ] Verify homepage rendering (events date ranges, blog excerpt + links)

- [ ] Remove PDF compression feature to reduce complexity
  - [ ] Delete `app/api/compress-pdf/route.ts`
  - [ ] Remove `compressPdfFile` exports/usages from `lib/compress/pdf.ts` and `lib/compress/index.ts`
  - [ ] Ensure no remaining imports of `compressPdfFile`
  - [ ] Run lint/typecheck/build

