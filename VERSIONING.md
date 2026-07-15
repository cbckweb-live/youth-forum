# Versioning — CBCK Youth Forum

**Current Version:** 1.0.0

---

## Versioning Strategy

This project follows **Semantic Versioning (SemVer)** — `MAJOR.MINOR.PATCH` (e.g. `1.2.3`).

### Format

```
MAJOR.MINOR.PATCH
```

| Component | When to Increment | Example |
|---|---|---|
| **MAJOR** | Incompatible API or architectural changes. Breaking UI redesigns. Database schema changes that break existing data. | `1.0.0` → `2.0.0` |
| **MINOR** | New features, new pages, new content types, or new functionality added in a backward-compatible manner. | `1.0.0` → `1.1.0` |
| **PATCH** | Bug fixes, style tweaks, documentation updates, dependency upgrades, performance improvements — backward-compatible only. | `1.0.0` → `1.0.1` |

---

## Pre-release & Build Metadata (Optional)

For pre-release versions, append a hyphen and identifier:

```
1.0.0-alpha.1
1.0.0-beta.2
1.0.0-rc.1
```

| Suffix | Meaning |
|---|---|
| `-alpha.N` | Early testing, features may be incomplete |
| `-beta.N` | Feature-complete, testing/bug fixes before release |
| `-rc.N` | Release candidate — final testing before production release |

---

## What Gets Versioned

The version in `package.json` is the **source of truth** for the project version. It is tracked in:

| Location | Purpose |
|---|---|
| `package.json` (`"version"` field) | Single source of truth |
| `memory.md` (header + overview + theme table) | Project memory and tracker |
| `VERSIONING.md` (version header) | This file |
| Git tags (`git tag v1.0.0`) | Release markers in repository |

---

## Release Cadence

| Release Type | Cadence | Description |
|---|---|---|
| **Patch releases** | As needed | Bug fixes and minor tweaks — no planning required. Released immediately when ready. |
| **Minor releases** | Monthly or per-feature | New features or pages. Bundled and released after testing. |
| **Major releases** | Infrequent, planned | Major redesigns, breaking changes, or significant architectural shifts. Planned and announced. |

---

## Release Process

### Creating a New Release

1. **Determine version bump** based on the changes (MAJOR / MINOR / PATCH).
2. **Update `package.json`** — change the `"version"` field.
3. **Update `memory.md`**:
   - Update the version in the header, overview, and theme table.
   - Add a new entry to the changelog with the version number.
4. **Commit to the default branch**:
   - Direct commit: commit the version bump directly to `master`.
   - Feature branch: create a branch, open a PR, and merge to `master` first.
5. **Tag the release** on the merge commit:
   ```bash
   git checkout master
   git pull
   git tag v1.0.0
   git push origin master --tags
   ```
6. **CI/CD** — The GitHub Actions workflow will automatically build and run smoke tests on the tagged commit.
7. **Deploy** — Vercel deploys the production build.

### Version Bump Checklist

- [ ] `package.json` version updated
- [ ] `memory.md` — header, overview, and theme table updated
- [ ] `memory.md` — changelog entry added with version
- [ ] Changes committed
- [ ] Git tag created (`vMAJOR.MINOR.PATCH`)
- [ ] Tag pushed to remote
- [ ] CI build passes
- [ ] Deploy verified on production

---

## Current Release

| Version | Date | Description |
|---|---|---|
| `1.0.0` | 15 July 2026 | Initial release. All 10 build phases complete. Core features: homepage, events, gallery, blog/news, office bearers, Mathetes, Cezo Mepu, Living Room, Journey, admin panel, media upload, launch infrastructure. |

---

## History

See [memory.md](./memory.md#changelog) for the full changelog.
