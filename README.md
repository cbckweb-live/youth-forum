# CBCK Youth Forum

**Version:** 1.0.1 — [Versioning Strategy](./docs/VERSIONING.md)

The official website for the Chakhesang Baptist Church Kohima Youth Ministry — a community of young believers growing together in faith, fellowship, and service.

**Live URL:** [cbckyouthforum.live](https://cbckyouthforum.live)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI Library | [React 19](https://react.dev) |
| Database & Auth | [Supabase](https://supabase.com) (Postgres + Row-Level Security) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Rich Text Editor | [TipTap](https://tiptap.dev) |
| Hosting | [Vercel](https://vercel.com) |
| Error Tracking | [Sentry](https://sentry.io) |
| CAPTCHA | [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) |
| Rate Limiting | In-memory (LRU Cache) |
| Edge Config | [Vercel Edge Config](https://vercel.com/docs/storage/edge-config) |

---

## Getting Started

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

### Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start development server |
| `yarn build` | Production build |
| `yarn start` | Start production server |
| `yarn lint` | Run ESLint |
| `yarn test:smoke` | Run smoke tests against localhost:3000 |
| `yarn test:smoke-console` | Run console-error smoke tests via Puppeteer |
| `yarn test:smoke-interactive` | Run interactive smoke tests via Puppeteer |
| `yarn check:esm` | Check for forbidden ESM-only transitive deps |

---

## Project Structure

```
├── app/              # Next.js App Router — pages and API routes
├── components/       # Reusable React components (public + admin)
├── lib/              # Supabase clients, utilities, helpers, rate limiter
├── src/              # Instrumentation (Sentry init)
├── public/           # Static assets (images, favicons)
├── tests/            # Smoke tests
├── scripts/          # Build scripts
├── .github/workflows/# CI/CD pipelines
├── supabase/         # Database migrations & RLS
└── docs/             # Project documentation
```

---

## Documentation

| File | Description |
|---|---|
| [PRD.md](./docs/PRD.md) | Product Requirements Document |
| [architecture.md](./docs/architecture.md) | App flow, folder structure, tech stack |
| [phases.md](./docs/phases.md) | Build phases in order |
| [design.md](./docs/design.md) | Design system — colors, fonts, components |
| [memory.md](./docs/memory.md) | Project progress tracker and changelog |
| [VERSIONING.md](./docs/VERSIONING.md) | Versioning strategy and release process |
| [RUNBOOK.md](./docs/RUNBOOK.md) | Operations runbook — deploy, backup, restore, admin |
| [backup setup.md](./docs/backup%20setup.md) | Database backup setup guide |

---

## Version

Current version: **1.0.1** — see [VERSIONING.md](./docs/VERSIONING.md) for the full versioning strategy and [memory.md](./docs/memory.md#changelog) for the changelog.

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [TipTap Documentation](https://tiptap.dev/docs)
- [Vercel Edge Config Documentation](https://vercel.com/docs/storage/edge-config)
- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
