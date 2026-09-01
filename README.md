# Mission Portal

A shared, self-service replacement for a monthly field-marketing planning spreadsheet.

Built while working as a campus brand ambassador, where a manager received a
monthly product allotment and had to manually build a spreadsheet dividing it
into mission types, then hand-assign each team member their share. This app
turns that into: **type in how much product you have this month, and the plan
generates and divides itself** — while giving each team member a live view of
their own missions and a place to log gear/placements.

This is an independent personal/portfolio project. It is not affiliated with
or endorsed by any employer or brand.

## What it does

- **Plan generator (admin):** enter the total units to distribute and the
  split across mission "pillars" (categories); the app computes how many
  missions are needed. Admins can pin specific categories to specific people
  first (e.g. someone asked for more of a category they like); whatever's
  left is split by priority weight with a random remainder pass, so the
  same person isn't stuck getting every month's "leftover" slot and no one's
  shut out of (or hoarding) a category.
- **Per-person view:** each team member sees only their own assigned
  missions, checks them off, and fills in the location/detail themselves
  once they've picked one.
- **Dashboard:** click the "Mission Manifest" logo to land on a team-wide
  overview — overall mission progress, quotas, everyone's completion, and
  shared-log stats — a neutral home base that isn't any one person's view.
- **Team-wide gear log:** a shared log (not siloed per-person) of placed
  equipment — fridges, barrels, DJ desks — with who placed it and whether
  it's still out in the field or been retrieved.
- **Mission contacts:** a shared, pooled log of contact info picked up while
  on mission (name, phone, email, address, venue), so it doesn't live in one
  person's notes app.
- **Per-person gear & clothing log:** each person logs clothing/merch in
  possession and other personal gear; admins track clothing stock on hand
  by size separately.
- **Admin tools:** edit quotas directly (spreadsheet-style), add/remove team
  members, set priority levels, export the current mission list to CSV, and
  rename the current planning period inline from the top bar.
- **Guided tutorial:** a spotlight-style walkthrough launches automatically
  on first login (adapts to whether you're in admin mode) and can be
  replayed anytime from "Tutorial mode" in the footer.

## Tech stack

- React 18 + Vite
- [lucide-react](https://lucide.dev) for icons
- No CSS framework — hand-written CSS custom properties for theming

## Data & storage

This started life as a Claude.ai artifact, which provides a built-in
key-value storage API (`window.storage`) scoped to the user's Claude account.
`src/storage.js` is a small adapter with three tiers, tried in order:

1. **Claude.ai artifact** — uses the host's `window.storage` API.
2. **Deployed on Netlify** (or running `netlify dev` locally) — shared data
   (the mission plan, gear log, contacts, etc.) goes through
   `netlify/functions/storage.js`, a small serverless function backed by
   [Netlify Blobs](https://docs.netlify.com/blobs/overview/). This is what
   makes the app actually sync across everyone's devices — no separate
   database to provision, Blobs comes with the Netlify site. Personal data
   (just the "which roster person am I" pointer) has no login system to key
   a server record to, so it always stays in that device's `localStorage`.
3. **Plain `npm run dev`** (no Netlify Function available) — falls back to
   `localStorage` for everything, same single-browser behavior as before.
   Fine for quick UI iteration; use `npm run dev:netlify` to actually
   exercise sync locally.

The tab also refetches shared data when it regains focus, so a teammate's
edits made elsewhere show up without a manual reload.

### Setting up Netlify Blobs (one-time)

```bash
npx netlify login          # if you haven't already
npx netlify link           # connect this folder to your Netlify site
                            # (or `netlify init` to create one)
npm run dev:netlify        # local dev with real Blobs-backed sync
```

Once the site is deployed on Netlify (`git push`, or `netlify deploy --prod`),
Blobs works automatically — no extra configuration or environment variables
needed.

**Note:** the seed data in `MissionPortal.jsx` currently contains real
teammate names and quotas from the internal planning sheet, for a live
walkthrough with a manager. Swap it back to fictional data before pushing
this branch anywhere public.

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL. Admin passcode for the demo data is
`changeme` — change it from the "Team & quotas" tab once you're in (or edit
`adminPasscode` in the seed data before deploying).

**Note:** this passcode check is purely client-side (a plaintext string
comparison in the bundled JS) and offers no real access control — anyone can
read it out of dev tools or the built bundle. Treat it as a UI convenience,
not authentication, until real auth (see "Next steps" below) is in place.

Requires Node 18+.

## Building for production

```bash
npm run build
npm run preview   # serve the production build locally to sanity-check it
```

The build output lands in `dist/`. Deploying it to Netlify (rather than a
plain static host) is what enables the shared/synced storage described
above — see "Setting up Netlify Blobs" in the Data & storage section.

## Next steps / roadmap

This is intentionally a working pilot, not a finished product. If it proves
useful for a real team, the honest next steps are:

1. **Real authentication**, ideally tied into an organization's existing
   identity provider (e.g. Microsoft Entra ID / SSO), rather than a single
   shared admin passcode. The backend now syncs everyone's data through one
   unauthenticated Netlify Function — fine for a small trusted pilot team
   with the URL, not something to expose broadly without this.
2. **Two-way sync with the existing planning spreadsheet**, if leadership
   wants to keep the source of truth in Excel/SharePoint — likely via
   Microsoft Graph API, which needs org-level app registration and IT
   sign-off.
3. **Automated tests.** There are none yet — fine for a pilot, but a real
   next step before this handles a live team's data.

## License

MIT — see [LICENSE](./LICENSE).
