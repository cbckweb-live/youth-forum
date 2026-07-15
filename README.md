# CBCK Youth Forum

**Version:** 1.0.0 — [Versioning Strategy](./VERSIONING.md)

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
| `yarn check:esm` | Check for forbidden ESM-only transitive deps |

---

## Project Structure

```
├── app/              # Next.js App Router — pages and API routes
├── components/       # Reusable React components (public + admin)
├── lib/              # Supabase clients, utilities, helpers
├── public/           # Static assets (images, favicons)
├── tests/            # Smoke tests
├── scripts/          # Build scripts
├── .github/workflows/# CI/CD pipelines
├── supabase/         # Database migrations
└── ...docs
```

---

## Documentation

| File | Description |
|---|---|
| [PRD.md](./PRD.md) | Product Requirements Document |
| [architecture.md](./architecture.md) | App flow, folder structure, tech stack |
| [phases.md](./phases.md) | Build phases in order |
| [design.md](./design.md) | Design system — colors, fonts, components |
| [memory.md](./memory.md) | Project progress tracker and changelog |
| [VERSIONING.md](./VERSIONING.md) | Versioning strategy and release process |

---

## Version

Current version: **1.0.0** — see [VERSIONING.md](./VERSIONING.md) for the full versioning strategy and [memory.md](./memory.md#changelog) for the changelog.

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [TipTap Documentation](https://tiptap.dev/docs)
