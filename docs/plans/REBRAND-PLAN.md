# Rebrand Plan: InKonnect → Dolmtschr

## Status: Ready to Execute

## Decision

**New name:** Dolmtschr
**Old name:** InKonnect / inkonnect
**Reason:** InKonnect too generic, multiple naming conflicts. Dolmtschr is unique, DACH-native, instantly recognizable as "Dolmetscher" (interpreter), with the dropped vowel giving it a modern tech identity.

## Domain Strategy

### Priority Registration (do ASAP)

| Domain | Purpose | Status |
|--------|---------|--------|
| `dolmtschr.com` | Primary / international | Available (checked 2025-02-14, no DNS) |
| `dolmtschr.at` | Austrian market / local trust | Available (checked 2025-02-14, no DNS) |
| `dolmtschr.app` | PWA context, modern | Available |
| `dolmtschr.io` | Tech/developer audience | Available |

**Recommendation:** Register `.com` + `.at` immediately. `.app` and `.io` are nice-to-have.

### DNS Setup
- `dolmtschr.com` → primary landing page + app
- `dolmtschr.at` → redirect to `.com` (or separate Austrian landing page later)
- `app.dolmtschr.com` → PWA instance
- `api.dolmtschr.com` → Gateway API
- `docs.dolmtschr.com` → Documentation (future)

---

## Codebase Rebrand

### Phase 1: Internal References (Non-Breaking)

These changes don't affect running code — safe to batch.

| File | Change |
|------|--------|
| `CLAUDE.md` | Replace "inkonnect" → "dolmtschr" in project description |
| `README.md` | Update project name, description, branding |
| `ROADMAP.md` | Update header, any references |
| `docs/architecture.md` | Update project name in diagrams and text |
| `docs/*.md` | Global find-replace in all documentation |
| `frontend/index.html` | `<title>`, meta tags, PWA manifest name |
| `frontend/public/manifest.json` | `name`, `short_name` → "Dolmtschr" |
| `LICENSE` | Update if project name is mentioned |

### Phase 2: Code References (Careful — May Break Imports)

| File / Pattern | Change | Notes |
|----------------|--------|-------|
| `App.tsx` line: `title="inkonnect"` | → `title="dolmtschr"` | Layout header |
| `frontend/src/api/inkonnect.ts` | Rename to `dolmtschr.ts` | Update ALL imports across frontend |
| `frontend/src/hooks/useSettings.ts` | localStorage key | Keep backward compat: migrate old key |
| `backend/config.py` | `database_url` default string | `inkonnect` → `dolmtschr` |
| `docker-compose.yml` | Service name, DB name, DB user | Requires DB migration or fresh start |
| `.env.example` | Update any inkonnect references | |

### Phase 3: Infrastructure (Requires Downtime / Fresh Deploy)

| Item | Change | Notes |
|------|--------|-------|
| Docker image name | `oidanice-inkonnect` → `oidanice-dolmtschr` | Rebuild |
| PostgreSQL database | `inkonnect` DB/user → `dolmtschr` | Fresh DB or `ALTER DATABASE` |
| Repo directory | `D:\repos\oidanice-inkonnect\` → `D:\repos\dolmtschr\` | Git remote stays same |
| Git remote / GitHub | Rename repo if on GitHub | GitHub handles redirects |
| Proxmox LXC/VM | Container/VM naming | Optional cosmetic |

### Phase 4: Brand Assets (After Code)

| Asset | Action |
|-------|--------|
| Logo | Design "DOLMTSCHR" wordmark — bold, mono, with 🎙️ or speech bubble icon |
| Favicon | D-shaped favicon or mic icon, 16x16 + 32x32 + 192x192 |
| PWA icons | 192x192 + 512x512 for manifest |
| OG image | Social media preview card (1200x630) |
| Color palette | Keep neobrutalism base, define primary accent |
| Business cards | OidaNice branding with "Dolmtschr" as product |

---

## Brand Architecture

```
OidaNice (Company / HomeLab-as-a-Service)
  └── Dolmtschr (Product — Voice Translation PWA)
        ├── Dolmtschr Free (self-hosted, open source?)
        ├── Dolmtschr Pro (managed hosting, €29-99/mo)
        └── Dolmtschr Enterprise (on-prem, custom profiles, €299/mo)
```

**Positioning:** "Dolmtschr — Dein AI-Dolmetscher. Made in Austria. Deine Daten bleiben bei dir."

**Taglines (candidates):**
- "Sprich. Versteh. Fertig." (Speak. Understand. Done.)
- "KI-Dolmetscher. Selbst gehostet. Datensouverän."
- "Barrierefreie Kommunikation in Echtzeit."
- "Der Dolmetscher, der nie krank wird." (The interpreter that never calls in sick) 😄

---

## Migration Strategy

### Option A: Big Bang (Recommended for Current Stage)

Since Dolmtschr is pre-launch with no production users:
1. Register domains
2. Do all code changes in one branch
3. Fresh `docker compose up` with new DB name
4. No backward compatibility needed
5. **Time:** 2-3 hours total

### Option B: Gradual (If Already in Production)

If there were existing users/deployments:
1. Add domain aliases (old + new work)
2. Code changes with backward compat
3. DB migration script (rename, update references)
4. Redirect old URLs → new
5. Deprecation period (3 months)
6. **Time:** 1-2 weeks

**Recommendation:** Option A — no users yet, clean break.

---

## localStorage Migration

Since settings are stored in localStorage under a key, add a one-time migration:

```typescript
// In useSettings.ts init
const OLD_KEY = 'inkonnect-settings'
const NEW_KEY = 'dolmtschr-settings'

function migrateSettings() {
  const old = localStorage.getItem(OLD_KEY)
  if (old && !localStorage.getItem(NEW_KEY)) {
    localStorage.setItem(NEW_KEY, old)
    localStorage.removeItem(OLD_KEY)
  }
}
```

---

## Trademark Check

**"Dolmtschr"** — zero results found for:
- App stores (iOS, Android)
- Google/Bing search
- Domain registrars
- Austrian trademark register (should verify at dpma.de / patentamt.at)

**Recommendation:** File Austrian trademark registration for "Dolmtschr" in Nice class 9 (software) and class 42 (SaaS). ~€250 via Patentamt.at.

---

## Claude Code Prompt

```
Rebrand inkonnect to dolmtschr. Read docs/plans/REBRAND-PLAN.md for details.

Phase 1: Update all documentation (CLAUDE.md, README, ROADMAP, docs/*.md)
Phase 2: Rename frontend API file, update imports, change Layout title, 
         update localStorage key with migration, update manifest.json
Phase 3: Update docker-compose.yml service/db names, config.py defaults, 
         .env.example

Use find-and-replace where safe. Be careful with import paths.
This is a Big Bang migration — no backward compat needed.
```
