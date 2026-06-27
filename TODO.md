- [ ] Fix `proxy.ts` cookie handling in Supabase SSR middleware (do not mutate `request.cookies`; write to a single `NextResponse` instance).
- [x] Re-test: make changes in admin page, then use browser Back/Forward and confirm login is not required again.


