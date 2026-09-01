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
  missions are needed and divides them across the team by a per-person
  priority weight, using largest-remainder rounding so the totals always add
  up exactly.
- **Per-person view:** each team member sees only their own assigned
  missions, checks them off, and fills in the location/detail themselves
  once they've picked one.
- **Gear & placement log:** each person logs their own equipment placements,
  clothing/merch in possession, and other gear — visible to the admin
  without having to ask.
- **Admin tools:** edit quotas directly (spreadsheet-style), add/remove team
  members, set priority levels, and export the current mission list to CSV.

## Tech stack

- React 18 + Vite
- [lucide-react](https://lucide.dev) for icons
- No CSS framework — hand-written CSS custom properties for theming

## Data & storage

This started life as a Claude.ai artifact, which provides a built-in
key-value storage API (`window.storage`) scoped to the user's Claude account.
`src/storage.js` is a small adapter: it uses that API when present, and falls
back to `localStorage` otherwise, so the same component runs both inside a
Claude artifact and as a normal deployed web app.

**Current limitation:** the `localStorage` fallback is single-browser only —
it will not sync between teammates on different devices. To actually run this
for a real team outside of claude.ai, you'd want to swap `src/storage.js` for
calls to a real backend (see "Next steps" below).

The seed data in `MissionPortal.jsx` is fictional/generic. The version this
project was built for seeds from a real internal planning sheet; that data is
private and intentionally not included here.

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL. Admin passcode for the demo data is
`changeme` — change it from the "Team & quotas" tab once you're in (or edit
`adminPasscode` in the seed data before deploying).

## Building for production

```bash
npm run build
npm run preview   # serve the production build locally to sanity-check it
```

The build output lands in `dist/` and can be deployed to any static host
(GitHub Pages, Netlify, Vercel, etc.) — keeping in mind the `localStorage`
sync limitation above.

## Next steps / roadmap

This is intentionally a working pilot, not a finished product. If it proves
useful for a real team, the honest next steps are:

1. **Real backend + database** (e.g. a small Node/Express or serverless API
   backed by Postgres) so data syncs across everyone's devices instead of
   living in one browser's `localStorage`.
2. **Real authentication**, ideally tied into an organization's existing
   identity provider (e.g. Microsoft Entra ID / SSO), rather than a single
   shared admin passcode.
3. **Two-way sync with the existing planning spreadsheet**, if leadership
   wants to keep the source of truth in Excel/SharePoint — likely via
   Microsoft Graph API, which needs org-level app registration and IT
   sign-off.

## License

MIT — see [LICENSE](./LICENSE).
