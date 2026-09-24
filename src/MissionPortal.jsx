import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Truck, Package, ShieldCheck, ShieldOff, CheckCircle2, Circle, Plus, Trash2,
  Lock, Unlock, Download, X, Users, ClipboardList, Shirt, Refrigerator,
  ChevronRight, AlertCircle, Loader2, Pencil, Save, HelpCircle, ArrowLeft,
  LayoutDashboard, CalendarPlus, History, Megaphone, UserPlus, UserMinus,
} from "lucide-react";
import storage, {
  hasHostStorage, getStoredPasscode, setStoredPasscode, clearStoredPasscode,
} from "./storage.js";

// ---------- Demo seed data ----------
// NOTE: this currently seeds real teammate names/quotas from the internal
// planning sheet, for a live walkthrough with a manager. Swap back to
// fictional names (see git history) before pushing anywhere public.
//
// Occasions are a per-team editable list now (see migrateTeamShape below) —
// this is only the starter list for a brand-new team, seeded with all 11
// pillars from the planning sheet (a migrated team keeps whatever subset its
// old catalog actually used; nothing is added to real data automatically).
const DEFAULT_OCCASIONS = [
  "Study", "Work", "Party & Socialize", "Sports", "Fitness", "Gaming",
  "Festivals", "Shopping", "Leisure", "Sales Support", "University Seeding",
];

function emptyPlanningConfig(occasions = DEFAULT_OCCASIONS) {
  return {
    cansGoal: 0,
    cansPerCase: 24,
    totalCases: 0,
    casesPerMission: 15,
    splits: Object.fromEntries(occasions.map((c) => [c, 0])),
    pins: [],
  };
}

function emptyCatalog(occasions = DEFAULT_OCCASIONS) {
  return occasions.map((category, i) => ({ id: `c${i}`, category, available: 0, remaining: 0 }));
}

const SEED = {
  // Which team's roster/quotas/missions are showing — team-specific data
  // lives under `teams`; gear, contacts, and clothing stock are shared
  // across every team, since they track physical assets, not a roster.
  teams: [
    {
      id: "lansing",
      name: "Lansing Team",
      monthLabel: "September 2026 — Lansing Team",
      windowNote: "Missions due the 2nd · Edits due the 4th",
      // Mirrors the "PLANNING FORMULA" section of the original sheet: a
      // monthly can goal converts to cases, cases convert to missions
      // needed, missions split by occasion.
      planningConfig: {
        cansGoal: 12300,
        cansPerCase: 24,
        totalCases: 513,
        casesPerMission: 15,
        splits: {
          "Study": 33,
          "Work": 19,
          "Party & Socialize": 21,
          "Sports": 6,
          "Fitness": 9,
          "Gaming": 12,
          "Sales Support": 0,
          "University Seeding": 0,
        },
        // Guaranteed picks applied before the random balanced split — e.g.
        // someone who specifically asked for more Gaming missions.
        pins: [],
      },
      catalog: [
        { id: "c1", category: "Study", available: 10, remaining: 1 },
        { id: "c2", category: "Work", available: 6, remaining: 2 },
        { id: "c3", category: "Party & Socialize", available: 6, remaining: 0 },
        { id: "c4", category: "Sports", available: 2, remaining: 0 },
        { id: "c5", category: "Fitness", available: 3, remaining: 0 },
        { id: "c6", category: "Gaming", available: 3, remaining: 0 },
        { id: "c10", category: "Sales Support", available: 2, remaining: 2 },
        { id: "c11", category: "University Seeding", available: 0, remaining: 0 },
      ],
      roster: [
        { id: "p1", name: "Will Kent", priority: 2 },
        { id: "p2", name: "Sophia Marcukaitis", priority: 2 },
        { id: "p3", name: "Noah Gleason", priority: 2 },
        { id: "p4", name: "Vivian Tieu", priority: 2 },
        { id: "p5", name: "Emilia Djuric", priority: 2 },
      ],
      assignments: {
        p1: [
          { id: "a1", category: "Study", note: "Main campus library", done: false },
          { id: "a2", category: "Party & Socialize", note: "Homecoming tailgate", done: false },
          { id: "a3", category: "Gaming", note: "Campus esports lounge", done: false },
        ],
        p2: [
          { id: "a4", category: "Study", note: "Study lounge (2x)", done: false },
          { id: "a5", category: "Study", note: "Study lounge (2x)", done: false },
          { id: "a6", category: "Work", note: "Workplaces of your choice (new venues)", done: false },
          { id: "a7", category: "Party & Socialize", note: "Events of your finding", done: false },
          { id: "a8", category: "Party & Socialize", note: "Events of your finding", done: false },
          { id: "a9", category: "Fitness", note: "Gym near west campus", done: false },
        ],
        p3: [
          { id: "a10", category: "Study", note: "Study lounge (2x)", done: false },
          { id: "a11", category: "Study", note: "Study lounge (2x)", done: false },
          { id: "a12", category: "Work", note: "Workplaces of your choice (new venues)", done: false },
          { id: "a13", category: "Party & Socialize", note: "Events of your finding", done: false },
          { id: "a14", category: "Sports", note: "Local sports event, TBD", done: false },
          { id: "a15", category: "Gaming", note: "Gaming store, during busy hours", done: false },
        ],
        p4: [
          { id: "a16", category: "Study", note: "Study lounge (2x)", done: false },
          { id: "a17", category: "Study", note: "Study lounge (2x)", done: false },
          { id: "a18", category: "Work", note: "Workplaces of your choice (new venues)", done: false },
          { id: "a19", category: "Party & Socialize", note: "Events of your finding", done: false },
          { id: "a20", category: "Sports", note: "Intramural fields on campus", done: false },
          { id: "a21", category: "Fitness", note: "Fitness event, TBD", done: false },
        ],
        p5: [
          { id: "a22", category: "Study", note: "Study lounge (2x)", done: false },
          { id: "a23", category: "Study", note: "Study lounge (2x)", done: false },
          { id: "a24", category: "Work", note: "Workplaces of your choice (new venues)", done: false },
          { id: "a25", category: "Party & Socialize", note: "Events of your finding", done: false },
          { id: "a26", category: "Fitness", note: "Fitness places nearby", done: false },
          { id: "a27", category: "Gaming", note: "Gaming store / event", done: false },
        ],
      },
      inventory: {
        p1: { clothing: [], other: [] },
        p2: { clothing: [], other: [] },
        p3: { clothing: [], other: [] },
        p4: { clothing: [], other: [] },
        p5: { clothing: [], other: [] },
      },
    },
    {
      id: "gr",
      name: "GR Team",
      monthLabel: "September 2026 — GR Team",
      windowNote: "Missions due the 2nd · Edits due the 4th",
      planningConfig: emptyPlanningConfig(),
      catalog: emptyCatalog(),
      roster: [],
      assignments: {},
      inventory: {},
    },
  ],
  // Team-wide (not per-person, not per-team) logs — these track physical
  // assets and contacts, which any team member from either team might place
  // or pick up, so they're shared rather than duplicated per team.
  placedAssets: [
    { id: "pa1", asset: "Mini Fridge", location: "Sample Venue", placedBy: "Will Kent", status: "placed", notes: "" },
  ],
  missionContacts: [],
  clothingStock: { S: 4, M: 10, L: 8, XL: 3 },
};

const PRIORITY_LABELS = { 1: "Low", 2: "Standard", 3: "High" };
// Field Focus is the default/majority, so it's left unlabeled — the tag
// only calls out the exception, same spirit as the "you" tag.
function smTypeTag(person) {
  return person.smType === "university" ? "Uni Focus" : null;
}
const ASSET_TYPES = ["Mini Fridge", "E-Barrel", "Ice Barrel", "DJ Desk", "Other"];
const CLOTHING_SIZES = ["S", "M", "L", "XL"];

// ---------- Mission model ----------
// A mission's `kind` follows from its occasion — sampling is the default,
// with the two other current pillars breaking out into their own kind so
// reporting (Phase 4) can bucket hours/cases correctly. 'seeding' as a
// kind is set aside for Phase 3's per-SM auto-created seeding missions.
function occasionKind(occasion) {
  if (occasion === "University Seeding") return "seeding";
  if (occasion === "Sales Support") return "sales_support";
  return "sampling";
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthLabel(label) {
  const m = /([A-Za-z]+)\s+(\d{4})/.exec(label || "");
  if (!m) return null;
  const idx = MONTH_NAMES.findIndex((n) => n.toLowerCase() === m[1].toLowerCase());
  if (idx === -1) return null;
  return `${m[2]}-${String(idx + 1).padStart(2, "0")}`;
}

// "2026-09" -> "October 2026" (the month after). Used to default the "Start
// new month" prompt so the common case (rolling straight into next month)
// needs zero typing.
function nextMonthKeyAndLabel(monthKey) {
  const [y, m] = (monthKey || currentMonthKey()).split("-").map(Number);
  const idx = m % 12;
  const year = m === 12 ? y + 1 : y;
  return { key: `${year}-${String(idx + 1).padStart(2, "0")}`, label: `${MONTH_NAMES[idx]} ${year}` };
}

function fillSplits(splits, occasions) {
  const out = {};
  occasions.forEach((o) => { out[o] = (splits && splits[o]) || 0; });
  return out;
}

// One-time, idempotent, self-healing shape upgrade: v4's per-team
// {catalog, assignments: {personId: [...]}} becomes v5's {occasions,
// missions: Mission[]} (see the brief's Mission interface). Runs on every
// team on every load — a team that already has `missions` passes straight
// through, so this is cheap once migrated, and it also upgrades a team
// coming straight from SEED (which is still written in the old shape,
// since it doubles as "what a legacy blob looks like").
function migrateTeamShape(team) {
  if (team.missions) {
    // Already v5. Every active view filters by `month`, so a team or a
    // mission that somehow lost its tag would silently show nothing —
    // heal that here rather than let the plan appear to vanish.
    const month = team.month || parseMonthLabel(team.monthLabel) || currentMonthKey();
    const missions = team.missions.map((m) => (m.month ? m : { ...m, month }));
    return month === team.month && missions.every((m, i) => m === team.missions[i]) ? team : { ...team, month, missions };
  }

  const occasions = team.catalog ? team.catalog.map((c) => c.category) : DEFAULT_OCCASIONS;
  const month = parseMonthLabel(team.monthLabel) || currentMonthKey();
  const now = new Date().toISOString();
  const defaultCases = team.planningConfig?.casesPerMission || 15;
  const missions = [];

  Object.entries(team.assignments || {}).forEach(([personId, list]) => {
    (list || []).forEach((a) => {
      missions.push({
        id: a.id, teamId: team.id, month, occasion: a.category, kind: occasionKind(a.category),
        assigneeIds: [personId], directive: a.note || "", location: "", date: "",
        plannedCases: defaultCases, status: a.done ? "completed" : "draft",
        createdAt: now, updatedAt: now, updatedBy: "migration",
      });
    });
  });

  // Old-style pins (a standing "guarantee this category to this person on
  // every future generate" rule) become one-time realized draft missions —
  // per the brief, generation itself no longer carries that guarantee
  // forward automatically.
  (team.planningConfig?.pins || []).forEach((pin) => {
    for (let i = 0; i < (pin.count || 0); i++) {
      missions.push({
        id: uid("m"), teamId: team.id, month, occasion: pin.category, kind: occasionKind(pin.category),
        assigneeIds: pin.personId ? [pin.personId] : [], directive: "Pinned", location: "", date: "",
        plannedCases: defaultCases, status: "draft",
        createdAt: now, updatedAt: now, updatedBy: "migration",
      });
    }
  });

  const { catalog, assignments, ...rest } = team;
  return {
    ...rest,
    occasions,
    month,
    deadlines: { missionsDue: null },
    planningConfig: { ...team.planningConfig, splits: fillSplits(team.planningConfig?.splits, occasions), pins: [] },
    missions,
  };
}

// Read-only summary row per occasion — replaces the old hand-edited
// available/remaining catalog. `planned` is the same round(total * split%)
// formula the generator uses; `assigned` counts real missions that exist
// right now (any status except cancelled); `remaining` is never negative.
// `month` defaults to the team's current month — quotas are always about
// "this month's" plan, never the whole mission history. Pass an explicit
// past month (see MonthHistory) to tally a closed month instead; in that
// case `planned` isn't meaningful (today's splits/goal don't describe a past
// month) so callers viewing history should ignore it and use `assigned`.
//
// Two different "remaining" numbers come out of this on purpose, for two
// different audiences: `remaining` (planned minus missions that exist yet,
// any status but cancelled) is the admin's "have I generated enough
// missions" gauge on the Team tab's Mission quotas table. `remainingToDo`
// (planned minus missions actually completed) is what the dashboard/missions
// quota strip shows everyone else — checking a mission off is the only
// thing that should move that number, since that's the one people watch
// day to day.
// ---------- Yearly can goal (branch-level, reported by Hunter after each
// month closes — mirrors the "Yearly Can Goals" tab on the source
// spreadsheet, where Goal is set per month up front and Actual is filled
// in once real numbers come back). Not derived from missions at all; this
// is a separate manual scoreboard against the annual corporate target.
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function emptyYearlyCanGoals(year = new Date().getFullYear()) {
  return { year, months: MONTH_LABELS.map(() => ({ goal: 0, actual: null })) };
}

// Pace is judged only against months Hunter has actually reported (`actual`
// set) — comparing to the full annual goal would read "behind" all year
// even when perfectly on track, and comparing to today's calendar date
// would break if reporting lags. `pct` (for the bar's fill) is still against
// the full-year goal, since that's the real finish line.
function computeYearlyCanProgress(yearlyCanGoals) {
  const months = yearlyCanGoals?.months || [];
  const totalGoal = months.reduce((s, m) => s + (Number(m.goal) || 0), 0);
  let actualToDate = 0;
  let goalToDate = 0;
  let reportedMonths = 0;
  months.forEach((m) => {
    if (m.actual !== null && m.actual !== undefined && m.actual !== "") {
      actualToDate += Number(m.actual) || 0;
      goalToDate += Number(m.goal) || 0;
      reportedMonths += 1;
    }
  });
  return {
    totalGoal,
    actualToDate,
    goalToDate,
    hasData: reportedMonths > 0,
    onPace: actualToDate >= goalToDate,
    pct: totalGoal > 0 ? Math.min(100, Math.round((actualToDate / totalGoal) * 100)) : 0,
  };
}

function computeQuotaSummary(team, month = team.month) {
  const totalMissions = Math.max(0, Math.round((team.planningConfig?.totalCases || 0) / (team.planningConfig?.casesPerMission || 1)));
  return (team.occasions || []).map((occasion) => {
    const pct = team.planningConfig?.splits?.[occasion] || 0;
    const planned = Math.round(totalMissions * (pct / 100));
    const matches = team.missions.filter((m) => m.occasion === occasion && m.status !== "cancelled" && m.month === month);
    const assigned = matches.length;
    const completed = matches.filter((m) => m.status === "completed").length;
    return {
      occasion, planned, assigned, completed,
      remaining: Math.max(0, planned - assigned),
      remainingToDo: Math.max(0, planned - completed),
    };
  });
}

// ---------- Guided tutorial ----------
// Steps that always apply, regardless of admin status.
const TOUR_STEPS_BASE = [
  {
    title: "Welcome to Mission Manifest",
    body: "A quick tour of how this works — about a minute, skip anytime.",
  },
  {
    target: "#tour-roster-rail",
    title: "Your team",
    body: "Everyone on the team is listed here. Pick a name to see their missions and gear log — your own is marked “you.”",
  },
  {
    target: "#tour-nav",
    title: "Missions & gear",
    setup: (ctx) => ctx.setTab("missions"),
    body: "Switch between your assigned missions and the team's gear log from here.",
  },
  {
    target: "#tour-missions-card",
    setup: (ctx) => ctx.setTab("missions"),
    title: "Your missions",
    body: "Check missions off as you complete them. Your FMS may suggest a location for some — that shows up here too.",
  },
  {
    target: "#tour-nav",
    setup: (ctx) => ctx.setTab("gear"),
    title: "Gear & placements",
    body: "Log fridges and barrels you place, contacts you pick up on mission, and gear you're carrying. Placed assets and mission contacts are shared with the whole team.",
  },
];

// Shown when the viewer is NOT currently in admin mode.
const TOUR_STEPS_ADMIN_HINT = [
  {
    target: "#tour-admin-toggle",
    title: "FMS: admin mode",
    body: "If you manage the team, unlock admin mode here to generate the monthly plan, edit quotas, and manage the roster.",
  },
];

// Shown when the viewer already has admin mode unlocked — points at the
// dedicated, more thorough admin walkthrough instead of repeating it here.
const TOUR_STEPS_ADMIN_POINTER = [
  {
    title: "You're in admin mode",
    body: "There's a separate, more detailed walkthrough for everything admin — quotas, the plan generator, roster, and clothing stock. Find it as “Admin walkthrough” in the footer whenever you're ready.",
  },
];

const TOUR_STEPS_FINAL = [
  {
    title: "That's it",
    body: "Replay this tour anytime from “Tutorial mode” in the footer.",
  },
];

function buildTourSteps(adminMode) {
  return [
    ...TOUR_STEPS_BASE,
    ...(adminMode ? TOUR_STEPS_ADMIN_POINTER : TOUR_STEPS_ADMIN_HINT),
    ...TOUR_STEPS_FINAL,
  ];
}

// Dedicated walkthrough for the admin-only side of the site — only ever
// launched from admin mode, since every target lives on the Team & quotas
// tab (which doesn't render unless adminMode is true).
const ADMIN_TOUR_STEPS = [
  {
    title: "The admin side",
    body: "A closer look at everything admin — quotas, the plan generator, roster, and clothing stock. About two minutes, skip anytime.",
  },
  {
    target: "#tour-nav",
    setup: (ctx) => ctx.setTab("team"),
    title: "Team & quotas",
    body: "Everything below lives on this one tab, which only admins can see.",
  },
  {
    target: "#tour-planning-header",
    setup: (ctx) => ctx.setTab("team"),
    title: "Planning header",
    body: "Set the deadline note shown to the whole team and the actual missions-due date — once it passes, the dashboard flags anything still missing a location. When the month's done, use “Start new month” here — it archives this month's missions to read-only history and gives you a fresh goal and deadline to fill in.",
  },
  {
    target: "#tour-occasions-card",
    setup: (ctx) => ctx.setTab("team"),
    title: "Occasions",
    body: "The pillars this team plans against — add or remove them here (you can't remove one still in use by a mission). Every split, filter, and mission picker below pulls from this list.",
  },
  {
    target: "#tour-generator-card",
    setup: (ctx) => ctx.setTab("team"),
    title: "Generate the plan",
    body: "Enter the total cases you were given and the percentage split across occasions, then preview — this only fills the gap between the target and what you've already hand-edited, so re-running never wipes out real work.",
  },
  {
    target: "#tour-favorites",
    setup: (ctx) => ctx.setTab("team"),
    title: "Favorites",
    body: "Pin a specific occasion to a specific person before generating — useful when someone's asked for more of something they like. Everything left over is still split randomly by priority.",
  },
  {
    target: "#tour-quotas-card",
    setup: (ctx) => ctx.setTab("team"),
    title: "Mission quotas",
    body: "A read-only summary computed live from the real missions below — planned vs. assigned vs. still remaining per occasion — plus the CSV export.",
  },
  {
    target: "#tour-plan-table-card",
    setup: (ctx) => ctx.setTab("team"),
    title: "Missions",
    body: "Every mission, editable inline — person, occasion, directive from the FMS, partner, date, location, and done status. Filter by occasion, status, or unassigned-only to work through the month in one sitting.",
  },
  {
    target: "#tour-opportunities-card",
    setup: (ctx) => ctx.setTab("team"),
    title: "Volunteer opportunities",
    body: "Post an RB-hosted event here and it shows up on everyone's dashboard with a sign-up button — separate from the monthly plan, so it doesn't get swept up by generate or a new month. You can also log a volunteer here yourself if someone tells you in person or by text.",
  },
  {
    target: "#tour-roster-manage-card",
    setup: (ctx) => ctx.setTab("team"),
    title: "Roster & priority",
    body: "Add or remove teammates, and set each person's priority — higher priority means a bigger share of missions when you generate a plan.",
  },
  {
    target: "#tour-clothing-stock",
    setup: (ctx) => ctx.setTab("team"),
    title: "Clothing stock",
    body: "Track how many of each size you have on hand — shown to everyone as context on the Gear & placements tab.",
  },
  {
    title: "That covers admin",
    body: "Replay this anytime from “Admin walkthrough” in the footer while you're in admin mode.",
  },
];

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function emptyInventory() {
  return { clothing: [], other: [] };
}

// ---------- Planning-formula engine ----------
// Splits `count` whole units across recipients weighted by `weights`. The
// floor of each person's weighted share is guaranteed (so priority still
// matters and no one with a real weight gets shut out); leftover units are
// handed out one at a time via weighted-random draw instead of always going
// to whoever has the largest fractional remainder, so the same people don't
// end up with the "leftover" slot every single month.
function distributeRandomBalanced(count, weights) {
  const sumW = weights.reduce((s, w) => s + w, 0);
  if (count <= 0 || sumW <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (count * w) / sumW);
  const result = raw.map(Math.floor);
  let remainder = count - result.reduce((s, f) => s + f, 0);
  const pool = raw.map((v, i) => ({ i, frac: v - Math.floor(v) }));
  while (remainder > 0 && pool.length > 0) {
    const totalFrac = pool.reduce((s, p) => s + (p.frac || 0.0001), 0);
    let r = Math.random() * totalFrac;
    let pick = 0;
    for (; pick < pool.length - 1; pick++) {
      r -= pool[pick].frac || 0.0001;
      if (r <= 0) break;
    }
    result[pool[pick].i] += 1;
    pool.splice(pick, 1);
    remainder -= 1;
  }
  return result;
}

// Turns "total cases this month" + occasion splits + team priorities (plus
// any manually-pinned favorites) into a *preview* of what generating would
// do — never applied directly. A mission only counts as replaceable if it's
// still an untouched draft (generator-made, no directive yet); anything an
// admin has edited, completed, or hand-added is always kept, and re-running
// generate only tops up the gap between the target count and what's kept.
// applyGeneratedPlan (below) turns this preview into the actual missions
// array once the admin confirms it.
function planGeneration(config, roster, occasions, existingMissions, month, actorName) {
  const totalMissions = Math.max(0, Math.round(config.totalCases / (config.casesPerMission || 1)));
  const weights = roster.map((p) => p.priority || 1);
  const pins = config.pins || [];
  const now = new Date().toISOString();

  // Only this month's missions are eligible to be topped up or replaced —
  // a past month's completed/leftover missions must never count toward (or
  // get swept up by) the current month's generate.
  const scoped = existingMissions.filter((m) => m.month === month);

  const removeIds = [];
  const toAdd = [];
  let keptCount = 0;

  occasions.forEach((occasion) => {
    const pct = config.splits[occasion] || 0;
    const target = Math.round(totalMissions * (pct / 100));
    const forOccasion = scoped.filter((m) => m.occasion === occasion);
    const untouchedDrafts = forOccasion.filter((m) => m.status === "draft" && !m.directive.trim());
    const kept = forOccasion.length - untouchedDrafts.length;
    keptCount += kept;
    untouchedDrafts.forEach((m) => removeIds.push(m.id));

    const needed = Math.max(0, target - kept);
    if (needed <= 0) return;

    const perPerson = roster.map(() => 0);
    let remaining = needed;
    pins.filter((pin) => pin.occasion === occasion).forEach((pin) => {
      const idx = roster.findIndex((p) => p.id === pin.personId);
      if (idx === -1 || remaining <= 0) return;
      const give = Math.min(pin.count, remaining);
      perPerson[idx] += give;
      remaining -= give;
    });
    if (remaining > 0) {
      distributeRandomBalanced(remaining, weights).forEach((n, idx) => { perPerson[idx] += n; });
    }

    roster.forEach((p, idx) => {
      for (let n = 0; n < perPerson[idx]; n++) {
        toAdd.push({
          id: uid("m"), month, occasion, kind: occasionKind(occasion),
          assigneeIds: [p.id], directive: "", location: "", date: "",
          plannedCases: config.casesPerMission || 15, status: "draft",
          createdAt: now, updatedAt: now, updatedBy: actorName || "Admin",
        });
      }
    });
  });

  return { removeIds, toAdd, removedCount: removeIds.length, keptCount, totalMissions };
}

function applyGeneratedPlan(existingMissions, plan) {
  const removeSet = new Set(plan.removeIds);
  return existingMissions.filter((m) => !removeSet.has(m.id)).concat(plan.toAdd);
}

// ---------- Storage helpers ----------
// v5 storage layout: one Netlify Blobs key per team (so editing Lansing's
// plan can't collide with a write to GR's, and vice versa), plus one key
// each for the cross-team gear log/contacts/clothing stock, plus an index
// key listing which team keys exist. This replaces v4's single
// "redbull-mission-portal-v4" blob, which put every team's data and every
// edit (a single checkbox included) behind one shared write.
//
// The legacy v4 key is READ (for a one-time migration) but never written or
// deleted — it stays as a rollback if v5 needs to be abandoned.
const LEGACY_V4_KEY = "redbull-mission-portal-v4";
const TEAMS_INDEX_KEY = "v5:teams-index";
const teamKey = (id) => `v5:team:${id}`;
const COMMON_ASSETS_KEY = "v5:common:assets";
const COMMON_CONTACTS_KEY = "v5:common:contacts";
const COMMON_CLOTHING_KEY = "v5:common:clothing";

async function getJSON(key, fallback) {
  try {
    const res = await storage.get(key, true);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {
    // not found or unreachable -> caller's fallback
  }
  return fallback;
}

// Writes every key that makes up `data` — used for the initial seed/migration
// write, where everything is new. Ordinary edits go through `persist` below,
// which only writes the keys that actually changed.
async function writeAllV5(data) {
  await Promise.all([
    storage.set(TEAMS_INDEX_KEY, JSON.stringify(data.teams.map((t) => t.id)), true),
    ...data.teams.map((t) => storage.set(teamKey(t.id), JSON.stringify(t), true)),
    storage.set(COMMON_ASSETS_KEY, JSON.stringify(data.placedAssets || []), true),
    storage.set(COMMON_CONTACTS_KEY, JSON.stringify(data.missionContacts || []), true),
    storage.set(COMMON_CLOTHING_KEY, JSON.stringify(data.clothingStock || {}), true),
  ]);
}

async function loadV5() {
  const ids = await getJSON(TEAMS_INDEX_KEY, null);
  if (!ids) return null;
  const teams = await Promise.all(ids.map((id) => getJSON(teamKey(id), null)));
  if (teams.some((t) => !t)) return null; // index/teams out of sync -> treat as absent, don't render a broken team
  const [placedAssets, missionContacts, clothingStock] = await Promise.all([
    getJSON(COMMON_ASSETS_KEY, []),
    getJSON(COMMON_CONTACTS_KEY, []),
    getJSON(COMMON_CLOTHING_KEY, {}),
  ]);
  return { teams, placedAssets, missionContacts, clothingStock };
}

// One-time v4 -> v5 migration: strips the plaintext adminPasscode field
// (the passcode now lives server-side only, see netlify/functions/storage.js)
// and re-shapes the single blob into the per-key layout above.
async function migrateFromV4() {
  const legacy = await getJSON(LEGACY_V4_KEY, null);
  if (!legacy) return null;
  const { adminPasscode, ...rest } = legacy;
  await writeAllV5(rest);
  return rest;
}

async function loadData() {
  const raw = (await loadV5()) || (await migrateFromV4()) || SEED;
  const needsShapeUpgrade = raw.teams.some((t) => !t.missions);
  const data = { ...raw, teams: raw.teams.map(migrateTeamShape) };
  // Persist immediately so storage doesn't lag behind what's displayed
  // until the next edit — matters both for a true rollback story and so
  // persist()'s reference-diffing has an accurate on-disk baseline. Best
  // effort: on the plain-Vite tier (no Netlify Function reachable), this
  // write 404s — the read side already falls back to seed data on storage
  // errors (see getJSON above), so this shouldn't take the whole app down.
  if (needsShapeUpgrade) {
    try { await writeAllV5(data); } catch (e) {}
  }
  return data;
}

// Diffs `next` against `prev` (the last snapshot we actually persisted) by
// reference equality — every mutator in this file builds new objects/arrays
// immutably, so an unchanged team/list keeps the same reference and is
// skipped here, while a changed one gets a new reference and its key gets
// rewritten. `prev` is null on the very first save after load, which writes
// everything once.
async function persist(next, prev) {
  try {
    const writes = [];
    const prevTeamById = new Map((prev ? prev.teams : []).map((t) => [t.id, t]));
    const idsChanged = !prev || prev.teams.length !== next.teams.length ||
      next.teams.some((t, i) => prev.teams[i]?.id !== t.id);
    if (idsChanged) writes.push(storage.set(TEAMS_INDEX_KEY, JSON.stringify(next.teams.map((t) => t.id)), true));
    next.teams.forEach((t) => {
      if (prevTeamById.get(t.id) !== t) writes.push(storage.set(teamKey(t.id), JSON.stringify(t), true));
    });
    if (!prev || prev.placedAssets !== next.placedAssets) {
      writes.push(storage.set(COMMON_ASSETS_KEY, JSON.stringify(next.placedAssets || []), true));
    }
    if (!prev || prev.missionContacts !== next.missionContacts) {
      writes.push(storage.set(COMMON_CONTACTS_KEY, JSON.stringify(next.missionContacts || []), true));
    }
    if (!prev || prev.clothingStock !== next.clothingStock) {
      writes.push(storage.set(COMMON_CLOTHING_KEY, JSON.stringify(next.clothingStock || {}), true));
    }
    await Promise.all(writes);
    return true;
  } catch (e) {
    return false;
  }
}

// ---------- Small UI atoms ----------
function Badge({ children, tone = "default" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function IconBtn({ onClick, title, children, danger }) {
  return (
    <button className={`icon-btn ${danger ? "icon-btn-danger" : ""}`} onClick={onClick} title={title} type="button">
      {children}
    </button>
  );
}

// ---------- Guided tutorial overlay ----------
function TutorialOverlay({ steps, stepIndex, onNext, onBack, onClose, ctx }) {
  const [rect, setRect] = useState(null);
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  useEffect(() => {
    if (step.setup) step.setup(ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  useEffect(() => {
    if (!step.target) { setRect(null); return; }
    const id = setTimeout(() => {
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "instant" });
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    }, 60);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  return (
    <div className="tour-clickblock" style={{ background: rect ? "transparent" : "rgba(10,16,28,0.6)" }}>
      {rect && (
        <div
          className="tour-spotlight"
          style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
        />
      )}
      <div className="tour-card">
        <div className="tour-card-head">
          <span className="tour-step-count">{stepIndex + 1} / {steps.length}</span>
          <IconBtn title="Skip tutorial" onClick={onClose}><X size={14} /></IconBtn>
        </div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="tour-actions">
          {stepIndex > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={13} /> Back</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={isLast ? onClose : onNext}>
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MissionPortal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [myId, setMyId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [activeTeamId, setActiveTeamId] = useState(null);
  // Everyone lands on the shared dashboard first, every visit — there's no
  // remembered identity to skip straight to (see the boot effect below).
  const [tab, setTab] = useState("dashboard");
  const [adminMode, setAdminMode] = useState(false);
  const [showIdentityPicker, setShowIdentityPicker] = useState(false);
  const [generatePreview, setGeneratePreview] = useState(null);
  const [tourActive, setTourActive] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const [tourStep, setTourStep] = useState(0);
  // Gate: on the Netlify tier, nothing loads until the shared-team passcode
  // is verified against the server (see netlify/functions/storage.js). The
  // Claude-artifact tier has its own per-account storage and skips this.
  const [gateChecking, setGateChecking] = useState(!hasHostStorage());
  const [needsPasscode, setNeedsPasscode] = useState(false);
  const [gateInput, setGateInput] = useState("");
  const [gateError, setGateError] = useState("");
  const saveTimer = useRef(null);
  const autoTourChecked = useRef(false);
  const lastPersistedRef = useRef(null);

  // Tries `pass` (or, on boot, whatever's already stored) against the
  // server. A confirmed wrong passcode (401) re-locks the gate; any other
  // failure (function unreachable, e.g. plain `npm run dev`) is treated as
  // "can't enforce this right now" and lets the app through, matching the
  // rest of this file's fall-through-on-error storage philosophy.
  async function verifyPasscode(pass) {
    if (pass !== undefined) setStoredPasscode(pass);
    try {
      await storage.list("", true);
      return true;
    } catch (e) {
      if (e && e.status === 401) {
        clearStoredPasscode();
        return false;
      }
      return true;
    }
  }

  useEffect(() => {
    if (hasHostStorage()) return;
    (async () => {
      const stored = getStoredPasscode();
      if (!stored) {
        setNeedsPasscode(true);
        setGateChecking(false);
        return;
      }
      const ok = await verifyPasscode();
      setNeedsPasscode(!ok);
      setGateChecking(false);
    })();
  }, []);

  async function trySiteUnlock() {
    const ok = await verifyPasscode(gateInput);
    if (ok) {
      setGateError("");
      setNeedsPasscode(false);
    } else {
      setGateError("That's not the passcode.");
    }
  }

  // No remembered identity anymore — every visit starts anonymous on the
  // shared dashboard (see the `tab` default above); picking your name there
  // (or from the roster rail / "Who are you?") is what sets `myId` for the
  // rest of this session only.
  useEffect(() => {
    if (gateChecking || needsPasscode) return;
    (async () => {
      const d = await loadData();
      lastPersistedRef.current = d;
      setData(d);
      setActiveTeamId(d.teams[0].id);
      setLoading(false);
    })();
  }, [gateChecking, needsPasscode]);

  // Refetch shared data when the tab regains focus, so teammates' edits
  // made elsewhere show up without a manual reload. Skipped mid-save so it
  // can't clobber an edit that's still in flight.
  useEffect(() => {
    function onFocus() {
      if (saveState === "saving" || gateChecking || needsPasscode) return;
      loadData().then((fresh) => {
        if (fresh) { lastPersistedRef.current = fresh; setData(fresh); }
      });
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [saveState, gateChecking, needsPasscode]);

  useEffect(() => {
    if (loading || !data || !viewId || autoTourChecked.current) return;
    autoTourChecked.current = true;
    (async () => {
      let seen = false;
      try {
        const res = await storage.get("tutorial-seen", false);
        seen = !!(res && res.value);
      } catch (e) {
        // not found -> not seen
      }
      if (!seen) startTour();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, data, viewId]);

  function startTour() {
    setTourSteps(buildTourSteps(adminMode));
    setTourStep(0);
    setTourActive(true);
  }

  function startAdminTour() {
    setTourSteps(ADMIN_TOUR_STEPS);
    setTourStep(0);
    setTourActive(true);
  }

  function closeTour() {
    setTourActive(false);
    storage.set("tutorial-seen", "1", false).catch(() => {});
  }

  const commit = useCallback((next) => {
    setData(next);
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const prev = lastPersistedRef.current;
      lastPersistedRef.current = next;
      const ok = await persist(next, prev);
      setSaveState(ok ? "saved" : "idle");
      setTimeout(() => setSaveState("idle"), 1500);
    }, 350);
  }, []);

  if (gateChecking) {
    return (
      <div className="portal-root portal-loading">
        <PortalStyles />
        <Loader2 className="spin" size={22} />
        <span>Checking access…</span>
      </div>
    );
  }

  if (needsPasscode) {
    return (
      <div className="portal-root portal-loading">
        <PortalStyles />
        <div className="modal-card">
          <div className="modal-head"><h3>Mission Manifest</h3></div>
          <div className="modal-body">
            <p className="muted">Enter the team passcode to continue.</p>
            <input
              className="text-input"
              type="password"
              autoFocus
              value={gateInput}
              onChange={(e) => setGateInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && trySiteUnlock()}
              placeholder="Passcode"
            />
            {gateError && <div className="error-text"><AlertCircle size={14} />{gateError}</div>}
            <button className="btn btn-primary" onClick={trySiteUnlock}>Continue</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="portal-root portal-loading">
        <PortalStyles />
        <Loader2 className="spin" size={22} />
        <span>Loading the manifest…</span>
      </div>
    );
  }

  const activeTeam = data.teams.find((t) => t.id === activeTeamId) || data.teams[0];
  // Every day-to-day view (dashboard, roster rail, missions tab, plan table,
  // quotas) should only ever see *this* month's missions — older months are
  // done and belong in the read-only history view, not mixed into today's
  // counts. Mutations still go through `activeTeam`/`commitTeam` (the full,
  // unfiltered mission array) so nothing here can accidentally lose history.
  const currentMonthTeam = { ...activeTeam, missions: activeTeam.missions.filter((m) => m.month === activeTeam.month) };
  const today = new Date().toISOString().slice(0, 10);
  const isPastMissionsDue = !!(activeTeam.deadlines?.missionsDue && today > activeTeam.deadlines.missionsDue);

  // Applies a patch (object, or updater function receiving the current team)
  // to whichever team is active, and commits the whole document.
  function commitTeam(patch) {
    const nextTeams = data.teams.map((t) =>
      t.id === activeTeam.id ? { ...t, ...(typeof patch === "function" ? patch(t) : patch) } : t
    );
    commit({ ...data, teams: nextTeams });
  }

  function switchTeam(id) {
    setActiveTeamId(id);
    setViewId(null);
  }

  const viewer = activeTeam.roster.find((r) => r.id === viewId) || null;

  function pickIdentity(id) {
    setMyId(id);
    setViewId(id);
    setShowIdentityPicker(false);
  }

  function currentActorName() {
    const me = activeTeam.roster.find((r) => r.id === myId);
    return me ? me.name : "Admin";
  }

  // ---- roster mutations (scoped to the active team) ----
  // smType is chosen once, at add-time — "field" (does missions, the
  // default/majority) or "university" (does case-seeding instead; see
  // University Focus notes). Nothing currently branches app behavior on it
  // yet beyond the roster tag below — that's the next step once the
  // University Focus hub itself gets built.
  function addMember(name, smType = "field") {
    const id = uid("p");
    commitTeam((t) => ({
      roster: [...t.roster, { id, name, smType }],
      inventory: { ...t.inventory, [id]: emptyInventory() },
    }));
    return id;
  }

  // A person's solo missions (no partner) are deleted with them, matching
  // the "this permanently deletes their missions" warning shown before this
  // runs; a mission they share with a partner just loses their slot.
  function removeMember(id) {
    const roster = activeTeam.roster.filter((r) => r.id !== id);
    const inventory = { ...activeTeam.inventory };
    delete inventory[id];
    const missions = activeTeam.missions
      .filter((m) => !(m.assigneeIds.includes(id) && m.assigneeIds.length === 1))
      .map((m) => (m.assigneeIds.includes(id) ? { ...m, assigneeIds: m.assigneeIds.filter((pid) => pid !== id) } : m));
    const volunteerOpportunities = (activeTeam.volunteerOpportunities || [])
      .map((o) => ({ ...o, volunteerIds: o.volunteerIds.filter((pid) => pid !== id) }));
    commitTeam({ roster, inventory, missions, volunteerOpportunities });
    if (viewId === id) setViewId(roster[0] ? roster[0].id : null);
    if (myId === id) setMyId(null);
  }

  function updatePlanningConfig(next) {
    commitTeam({ planningConfig: next });
  }

  function updateYearlyCanGoals(next) {
    commitTeam({ yearlyCanGoals: next });
  }

  // Adding an occasion extends the splits map; removing one is refused
  // (surfaced in the UI) while any mission still references it, so a
  // mission never ends up pointing at an occasion that no longer exists.
  function addOccasion(name) {
    commitTeam((t) => ({
      occasions: [...t.occasions, name],
      planningConfig: { ...t.planningConfig, splits: { ...t.planningConfig.splits, [name]: 0 } },
    }));
  }

  function removeOccasion(name) {
    commitTeam((t) => ({ occasions: t.occasions.filter((o) => o !== name) }));
  }

  function updatePriority(personId, priority) {
    commitTeam((t) => ({ roster: t.roster.map((p) => (p.id === personId ? { ...p, priority } : p)) }));
  }

  // Closes out the current month and opens a new one. Missions themselves
  // are never touched here — they're already tagged with the month they
  // were created in, so simply moving `team.month` forward is what makes
  // last month's missions fall out of every active view (dashboard, roster
  // rail, quotas, plan table, generate) and into read-only history, while
  // the raw data stays in `missions` forever for that history view and CSV
  // export. `monthHistory` records the *label* for that month so history
  // can show "September 2026" instead of a bare "2026-09" key.
  function startNewMonth(newMonthKey, newMonthLabel) {
    setGeneratePreview(null);
    commitTeam((t) => {
      const monthHistory = (t.monthHistory || []).some((h) => h.month === t.month)
        ? t.monthHistory
        : [...(t.monthHistory || []), { month: t.month, label: t.monthLabel }];
      return {
        month: newMonthKey,
        monthLabel: newMonthLabel,
        monthHistory,
        windowNote: "",
        deadlines: { missionsDue: null },
        planningConfig: { ...t.planningConfig, cansGoal: 0, totalCases: 0 },
      };
    });
  }

  // ---- plan generation (preview, then explicit confirm/cancel) ----
  function previewGeneratePlan() {
    setGeneratePreview(
      planGeneration(activeTeam.planningConfig, activeTeam.roster, activeTeam.occasions, activeTeam.missions, activeTeam.month, currentActorName())
    );
  }

  function confirmGeneratePlan() {
    if (!generatePreview) return;
    commitTeam((t) => ({ missions: applyGeneratedPlan(t.missions, generatePreview) }));
    setGeneratePreview(null);
  }

  function cancelGeneratePlan() {
    setGeneratePreview(null);
  }

  // ---- mission mutations (scoped to the active team) ----
  function addMission(occasion, assigneeIds, directive) {
    const now = new Date().toISOString();
    commitTeam((t) => ({
      missions: [...t.missions, {
        id: uid("m"), teamId: t.id, month: t.month, occasion, kind: occasionKind(occasion),
        assigneeIds, directive: directive || "", location: "", date: "",
        plannedCases: t.planningConfig.casesPerMission || 15,
        status: (directive || "").trim() ? "edited" : "draft",
        createdAt: now, updatedAt: now, updatedBy: currentActorName(),
      }],
    }));
  }

  // General-purpose field edit (directive/location/date/occasion/assigneeIds)
  // — any edit promotes a still-untouched draft to "edited" so a later
  // regenerate can never silently wipe it out.
  function updateMission(missionId, patch) {
    const now = new Date().toISOString();
    commitTeam((t) => ({
      missions: t.missions.map((m) => (m.id === missionId
        ? { ...m, ...patch, status: m.status === "draft" ? "edited" : m.status, updatedAt: now, updatedBy: currentActorName() }
        : m)),
    }));
  }

  function toggleMissionDone(missionId) {
    const now = new Date().toISOString();
    commitTeam((t) => ({
      missions: t.missions.map((m) => (m.id === missionId
        ? { ...m, status: m.status === "completed" ? "edited" : "completed", updatedAt: now, updatedBy: currentActorName() }
        : m)),
    }));
  }

  function removeMission(missionId) {
    commitTeam((t) => ({ missions: t.missions.filter((m) => m.id !== missionId) }));
  }

  // ---- inventory mutations (scoped to the active team) ----
  function addInventoryItem(personId, bucket, item) {
    commitTeam((t) => {
      const inv = t.inventory[personId] || emptyInventory();
      return { inventory: { ...t.inventory, [personId]: { ...inv, [bucket]: [...(inv[bucket] || []), { id: uid("i"), ...item }] } } };
    });
  }

  function removeInventoryItem(personId, bucket, itemId) {
    commitTeam((t) => {
      const inv = t.inventory[personId] || emptyInventory();
      return { inventory: { ...t.inventory, [personId]: { ...inv, [bucket]: (inv[bucket] || []).filter((x) => x.id !== itemId) } } };
    });
  }

  // ---- placed-asset mutations (team-wide) ----
  function addPlacedAsset(item) {
    commit({ ...data, placedAssets: [...(data.placedAssets || []), { id: uid("pa"), status: "placed", ...item }] });
  }

  function removePlacedAsset(id) {
    commit({ ...data, placedAssets: (data.placedAssets || []).filter((x) => x.id !== id) });
  }

  function toggleAssetStatus(id) {
    const next = (data.placedAssets || []).map((x) =>
      x.id === id ? { ...x, status: x.status === "placed" ? "retrieved" : "placed" } : x
    );
    commit({ ...data, placedAssets: next });
  }

  // ---- mission-contact mutations (team-wide) ----
  function addMissionContact(item) {
    commit({ ...data, missionContacts: [...(data.missionContacts || []), { id: uid("ct"), loggedBy: myId, ...item }] });
  }

  function removeMissionContact(id) {
    commit({ ...data, missionContacts: (data.missionContacts || []).filter((x) => x.id !== id) });
  }

  // ---- clothing stock ----
  function updateClothingStock(size, value) {
    commit({ ...data, clothingStock: { ...(data.clothingStock || {}), [size]: value } });
  }

  // ---- volunteer opportunities (scoped to the active team) ----
  // One-off RB-hosted events the FMS needs SMs to volunteer for —
  // separate from the monthly mission plan (not month-scoped, not part of
  // the can quota), since these come up ad hoc and outlast any one month.
  function addOpportunity(title, details, date, location) {
    commitTeam((t) => ({
      volunteerOpportunities: [...(t.volunteerOpportunities || []), {
        id: uid("op"), title, details: details || "", date: date || "", location: location || "",
        createdAt: new Date().toISOString(), createdBy: currentActorName(), volunteerIds: [],
      }],
    }));
  }

  function removeOpportunity(oppId) {
    commitTeam((t) => ({ volunteerOpportunities: (t.volunteerOpportunities || []).filter((o) => o.id !== oppId) }));
  }

  function toggleVolunteer(oppId, personId) {
    commitTeam((t) => ({
      volunteerOpportunities: (t.volunteerOpportunities || []).map((o) => (o.id === oppId
        ? { ...o, volunteerIds: o.volunteerIds.includes(personId) ? o.volunteerIds.filter((id) => id !== personId) : [...o.volunteerIds, personId] }
        : o)),
    }));
  }

  function exportCsv(month = activeTeam.month, label = activeTeam.monthLabel) {
    const nameOf = (id) => activeTeam.roster.find((r) => r.id === id)?.name || "Unassigned";
    const rows = [["Person", "Partner", "Occasion", "Directive", "Date", "Location", "Status"]];
    activeTeam.missions.filter((m) => m.month === month).forEach((m) => {
      const [primary, ...rest] = m.assigneeIds.length ? m.assigneeIds.map(nameOf) : ["Unassigned"];
      rows.push([primary, rest.join(", "), m.occasion, m.directive, m.date, m.location, m.status]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label.replace(/[^\w]+/g, "-")}-missions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="portal-root">
      <PortalStyles />

      {showIdentityPicker && (
        <IdentityModal
          roster={activeTeam.roster}
          onPick={pickIdentity}
          onCreate={(name) => {
            const id = addMember(name);
            pickIdentity(id);
          }}
          onAdminClick={() => {
            setShowIdentityPicker(false);
            setAdminMode(true);
          }}
        />
      )}

      <header className="top-bar">
        <div className="brand brand-clickable" onClick={() => setTab("dashboard")} title="Go to dashboard">
          <Truck size={20} strokeWidth={2.2} />
          <div>
            <div className="brand-title">Mission Manifest</div>
            <div id="tour-month-label" className="brand-sub">{activeTeam.monthLabel}</div>
          </div>
        </div>
        <select
          className="team-switcher"
          id="tour-team-switcher"
          value={activeTeam.id}
          onChange={(e) => switchTeam(e.target.value)}
        >
          {data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <nav className="top-nav" id="tour-nav">
          <TabBtn active={tab === "missions"} onClick={() => setTab("missions")} icon={<ClipboardList size={15} />} label="Missions" />
          <TabBtn active={tab === "gear"} onClick={() => setTab("gear")} icon={<Package size={15} />} label="Gear & placements" />
          {adminMode && <TabBtn active={tab === "team"} onClick={() => setTab("team")} icon={<Users size={15} />} label="Team & quotas" />}
        </nav>
        <div className="top-actions">
          <SaveIndicator state={saveState} />
          {adminMode ? (
            <button
              id="tour-admin-toggle"
              className="btn btn-ghost"
              onClick={() => {
                setAdminMode(false);
                if (tab === "team") setTab("missions");
              }}
            >
              <ShieldOff size={15} /> Exit admin
            </button>
          ) : (
            <button id="tour-admin-toggle" className="btn btn-ghost" onClick={() => setAdminMode(true)}>
              <Lock size={15} /> Admin
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => setShowIdentityPicker(true)}>
            {myId ? data.teams.flatMap((t) => t.roster).find((r) => r.id === myId)?.name || "Switch" : "Who are you?"}
          </button>
        </div>
      </header>

      <div className="body-grid">
        <aside className="roster-rail" id="tour-roster-rail">
          <button
            className={`roster-item roster-item-dashboard ${tab === "dashboard" ? "roster-item-active" : ""}`}
            onClick={() => setTab("dashboard")}
          >
            <span className="roster-name"><LayoutDashboard size={15} /> Dashboard</span>
          </button>
          <div className="rail-label">{activeTeam.name}</div>
          <nav>
            {activeTeam.roster.map((p) => {
              const list = currentMonthTeam.missions.filter((m) => m.assigneeIds.includes(p.id));
              const done = list.filter((m) => m.status === "completed").length;
              return (
                <button
                  key={p.id}
                  className={`roster-item ${viewId === p.id ? "roster-item-active" : ""}`}
                  onClick={() => { setViewId(p.id); setTab("missions"); }}
                >
                  <span className="roster-name">
                    {p.name}
                    {smTypeTag(p) && <span className="sm-type-tag">{smTypeTag(p)}</span>}
                    {p.id === myId && <span className="you-tag">you</span>}
                  </span>
                  <span className="roster-progress">{done}/{list.length}</span>
                </button>
              );
            })}
          </nav>
          {adminMode && <AddMemberInline onAdd={addMember} />}
        </aside>

        <main className="main-panel">
          {tab === "dashboard" && (
            <DashboardTab
              data={currentMonthTeam}
              myId={myId}
              placedAssets={data.placedAssets || []}
              missionContacts={data.missionContacts || []}
              isPastMissionsDue={isPastMissionsDue}
              // Landing here is anonymous now (see the boot effect) —
              // clicking your name on the dashboard is how you identify
              // yourself for the rest of this visit, not just "view as".
              onSelectPerson={(id) => { pickIdentity(id); setTab("missions"); }}
              onToggleVolunteer={(oppId) => (
                // Only someone on *this* team's roster can sign up here — if
                // you're viewing another team (or haven't said who you are),
                // pick an identity on it first.
                myId && activeTeam.roster.some((r) => r.id === myId) ? toggleVolunteer(oppId, myId) : setShowIdentityPicker(true)
              )}
            />
          )}

          {!viewer && (tab === "missions" || tab === "gear") && (
            <div className="empty-state">
              <Users size={28} />
              <p>No one's selected. Pick a name from the roster.</p>
            </div>
          )}

          {viewer && tab === "missions" && (
            <MissionsTab
              key={`${activeTeam.id}:${viewer.id}`}
              data={currentMonthTeam}
              viewer={viewer}
              adminMode={adminMode}
              onAdd={addMission}
              onToggle={toggleMissionDone}
              onRemove={removeMission}
              onUpdateMission={updateMission}
            />
          )}

          {viewer && tab === "gear" && (
            <GearTab
              viewer={viewer}
              placedByName={viewer.name}
              inventory={activeTeam.inventory[viewer.id] || emptyInventory()}
              placedAssets={data.placedAssets || []}
              missionContacts={data.missionContacts || []}
              clothingStock={data.clothingStock || {}}
              onAdd={addInventoryItem}
              onRemove={removeInventoryItem}
              onAddAsset={addPlacedAsset}
              onRemoveAsset={removePlacedAsset}
              onToggleAssetStatus={toggleAssetStatus}
              onAddContact={addMissionContact}
              onRemoveContact={removeMissionContact}
            />
          )}

          {adminMode && tab === "team" && (
            <TeamTab
              key={activeTeam.id}
              data={currentMonthTeam}
              allMissions={activeTeam.missions}
              monthHistory={activeTeam.monthHistory || []}
              clothingStock={data.clothingStock || {}}
              onRemoveMember={removeMember}
              onExport={exportCsv}
              onStartNewMonth={startNewMonth}
              onUpdateMeta={(patch) => commitTeam(patch)}
              onUpdatePlanningConfig={updatePlanningConfig}
              onUpdateYearlyCanGoals={updateYearlyCanGoals}
              onUpdatePriority={updatePriority}
              onAddOccasion={addOccasion}
              onRemoveOccasion={removeOccasion}
              generatePreview={generatePreview}
              onPreviewGenerate={previewGeneratePlan}
              onConfirmGenerate={confirmGeneratePlan}
              onCancelGenerate={cancelGeneratePlan}
              addMember={addMember}
              onUpdateClothingStock={updateClothingStock}
              onAddMission={addMission}
              onUpdateMission={updateMission}
              onRemoveMission={removeMission}
              onToggleMissionDone={toggleMissionDone}
              isPastMissionsDue={isPastMissionsDue}
              onAddOpportunity={addOpportunity}
              onRemoveOpportunity={removeOpportunity}
              onToggleVolunteer={toggleVolunteer}
            />
          )}
        </main>
      </div>

      <footer className="app-footer">
        <span className="muted footer-note">Mission Manifest — a self-service field-marketing planner.</span>
        <div className="footer-actions">
          {adminMode && (
            <button className="btn btn-ghost btn-sm" onClick={startAdminTour}>
              <ShieldCheck size={14} /> Admin walkthrough
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={startTour}>
            <HelpCircle size={14} /> Tutorial mode
          </button>
          {!hasHostStorage() && (
            <button
              className="btn btn-ghost btn-sm"
              title="Forget the passcode on this device"
              onClick={() => { clearStoredPasscode(); window.location.reload(); }}
            >
              <Lock size={14} /> Lock
            </button>
          )}
        </div>
      </footer>

      {tourActive && tourSteps.length > 0 && (
        <TutorialOverlay
          steps={tourSteps}
          stepIndex={tourStep}
          onNext={() => setTourStep((s) => Math.min(s + 1, tourSteps.length - 1))}
          onBack={() => setTourStep((s) => Math.max(s - 1, 0))}
          onClose={closeTour}
          ctx={{ setTab }}
        />
      )}
    </div>
  );
}

function SaveIndicator({ state }) {
  if (state === "saving") return <span className="save-indicator"><Loader2 className="spin" size={13} /> Saving</span>;
  if (state === "saved") return <span className="save-indicator save-ok"><CheckCircle2 size={13} /> Saved</span>;
  return <span className="save-indicator save-idle">Synced</span>;
}

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button className={`top-nav-btn ${active ? "top-nav-btn-active" : ""}`} onClick={onClick} type="button">
      {icon} {label}
    </button>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function IdentityModal({ roster, onPick, onCreate, onAdminClick }) {
  const [newName, setNewName] = useState("");
  return (
    <div className="modal-backdrop">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Who's checking in?</h3>
        </div>
        <div className="modal-body">
          <p className="muted">Pick your name to see your missions and log your gear.</p>
          <div className="identity-list">
            <button className="identity-row identity-row-admin" onClick={onAdminClick}>
              <span className="identity-admin-label"><Lock size={14} /> Admin</span>
              <ChevronRight size={15} />
            </button>
            {roster.map((p) => (
              <button key={p.id} className="identity-row" onClick={() => onPick(p.id)}>
                <span>{p.name}{smTypeTag(p) && <span className="sm-type-tag">{smTypeTag(p)}</span>}</span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
          <div className="identity-new">
            <input
              className="text-input"
              placeholder="Not on the list? Add your name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newName.trim() && onCreate(newName.trim())}
            />
            <button
              className="btn btn-primary"
              disabled={!newName.trim()}
              onClick={() => newName.trim() && onCreate(newName.trim())}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddMemberInline({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [smType, setSmType] = useState("field");
  if (!open) {
    return (
      <button className="rail-add" onClick={() => setOpen(true)}>
        <Plus size={14} /> Add teammate
      </button>
    );
  }
  function submit() {
    if (!name.trim()) return;
    onAdd(name.trim(), smType);
    setName("");
    setSmType("field");
    setOpen(false);
  }
  return (
    <div className="rail-add-form">
      <input
        className="text-input text-input-sm"
        autoFocus
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <div className="sm-type-picker">
        <button type="button" className={`sm-type-option ${smType === "field" ? "sm-type-option-active" : ""}`} onClick={() => setSmType("field")}>Field Focus</button>
        <button type="button" className={`sm-type-option ${smType === "university" ? "sm-type-option-active" : ""}`} onClick={() => setSmType("university")}>Uni Focus</button>
      </div>
      <button className="btn btn-primary btn-sm" onClick={submit}>Add</button>
    </div>
  );
}

function DashboardTab({ data, myId, placedAssets, missionContacts, isPastMissionsDue, onSelectPerson, onToggleVolunteer }) {
  const roster = data.roster;
  // Past-dated events drop off here automatically (they stay on the admin
  // card, flagged, until someone deletes them). Undated ones never expire.
  const today = new Date().toISOString().slice(0, 10);
  const opportunities = (data.volunteerOpportunities || []).filter((o) => !o.date || o.date >= today);
  const nameOf = (id) => roster.find((r) => r.id === id)?.name || "Someone";
  const totalAssigned = data.missions.length;
  const totalDone = data.missions.filter((m) => m.status === "completed").length;
  const stillPlaced = placedAssets.filter((a) => a.status === "placed").length;
  const contacts = missionContacts;
  const overdue = data.missions.filter((m) => !m.location.trim() && !m.date.trim());
  const quotaSummary = computeQuotaSummary(data).filter((q) => q.planned > 0);
  const lastChange = data.missions
    .filter((m) => m.updatedBy && m.updatedBy !== "migration")
    .reduce((latest, m) => (!latest || m.updatedAt > latest.updatedAt ? m : latest), null);
  const lastChangeLabel = lastChange
    ? `Last change ${new Date(lastChange.updatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} by ${lastChange.updatedBy}`
    : null;
  const yearlyGoal = computeYearlyCanProgress(data.yearlyCanGoals || emptyYearlyCanGoals());

  return (
    <div className="tab-content">
      <section className="card">
        <div className="card-head">
          <h2>{data.monthLabel}</h2>
          <Badge tone={totalAssigned > 0 && totalDone === totalAssigned ? "good" : "default"}>
            {totalDone} of {totalAssigned} missions complete
          </Badge>
        </div>
        <p className="muted">{data.windowNote}</p>
        {lastChangeLabel && <p className="muted empty-hint">{lastChangeLabel}</p>}
        {isPastMissionsDue && overdue.length > 0 && (
          <p className="muted empty-hint overdue-hint">
            <AlertCircle size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
            Past the missions-due date — {overdue.length} mission{overdue.length > 1 ? "s" : ""} still {overdue.length > 1 ? "have" : "has"} no location or date set.
          </p>
        )}
      </section>

      {yearlyGoal.hasData && (
        <section className="card">
          <div className="card-head">
            <h2>Yearly can goal</h2>
            <Badge tone={yearlyGoal.onPace ? "good" : "bad"}>{yearlyGoal.onPace ? "On pace" : "Behind pace"}</Badge>
          </div>
          <div className="yearly-goal-bar-wrap">
            <span
              className={`yearly-goal-bar ${yearlyGoal.onPace ? "yearly-goal-bar-good" : "yearly-goal-bar-bad"}`}
              style={{ width: `${yearlyGoal.pct}%` }}
            />
          </div>
          <p className="muted empty-hint">
            {yearlyGoal.actualToDate.toLocaleString()} of {yearlyGoal.totalGoal.toLocaleString()} cans this year
            ({yearlyGoal.pct}% of the annual goal) — {yearlyGoal.onPace ? "ahead of or matching" : "behind"} the {yearlyGoal.goalToDate.toLocaleString()}-can pace for the months reported so far.
          </p>
        </section>
      )}

      <section className="quota-strip">
        {quotaSummary.map((q) => (
          <div key={q.occasion} className="quota-chip">
            <span className="quota-cat">{q.occasion}</span>
            <span className="quota-num">{q.remainingToDo}<span className="quota-of">/{q.planned}</span></span>
          </div>
        ))}
      </section>

      {opportunities.length > 0 && (
        <section className="card">
          <div className="card-head"><h2><Megaphone size={16} /> Volunteer opportunities</h2><Badge>{opportunities.length}</Badge></div>
          <p className="muted empty-hint">RB-hosted events your FMS (Field Marketing Specialist) needs people for — still paid, just opt-in. Sign up below (they'll likely also text around).</p>
          <ul className="opportunity-list">
            {opportunities.map((o) => {
              const inIt = myId && o.volunteerIds.includes(myId);
              return (
                <li key={o.id} className="opportunity-row">
                  <div className="opportunity-text">
                    <span className="opportunity-title">{o.title}</span>
                    {o.details && <span className="opportunity-details">{o.details}</span>}
                    {(o.date || o.location) && (
                      <span className="mission-secondary">{o.date}{o.date && o.location && " · "}{o.location}</span>
                    )}
                    <span className="muted opportunity-volunteers">
                      {o.volunteerIds.length === 0
                        ? "No one's signed up yet"
                        : `${o.volunteerIds.length} in: ${o.volunteerIds.map(nameOf).join(", ")}`}
                    </span>
                  </div>
                  <button
                    className={`btn btn-sm ${inIt ? "btn-ghost" : "btn-primary"}`}
                    onClick={() => onToggleVolunteer(o.id)}
                  >
                    {inIt ? <><UserMinus size={13} /> Withdraw</> : <><UserPlus size={13} /> Volunteer</>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="card-head"><h2><Users size={16} /> Team progress</h2></div>
        <ul className="dashboard-progress-list">
          {roster.map((p) => {
            const list = data.missions.filter((m) => m.assigneeIds.includes(p.id));
            const done = list.filter((m) => m.status === "completed").length;
            const pct = list.length ? Math.round((done / list.length) * 100) : 0;
            return (
              <li key={p.id}>
                <button className="dashboard-progress-row" onClick={() => onSelectPerson(p.id)}>
                  <span className="dashboard-progress-name">
                    {p.name}
                    {smTypeTag(p) && <span className="sm-type-tag">{smTypeTag(p)}</span>}
                    {p.id === myId && <span className="you-tag">you</span>}
                  </span>
                  <span className="dashboard-progress-bar-wrap">
                    <span className="dashboard-progress-bar" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="roster-progress">{done}/{list.length}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card">
        <div className="card-head">
          <h2><Refrigerator size={16} /> Placed assets</h2>
          <Badge>{stillPlaced} of {placedAssets.length} still out</Badge>
        </div>
        <p className="muted empty-hint">
          Where team equipment is right now, and who has it — no more "who has the barrel?" texts.
          {contacts.length > 0 && ` Also ${contacts.length} mission contact${contacts.length > 1 ? "s" : ""} logged.`}
        </p>

        {placedAssets.length === 0 && <p className="muted empty-hint">Nothing logged yet.</p>}

        <ul className="gear-list">
          {placedAssets.map((it) => (
            <li key={it.id} className="gear-row">
              <div className="gear-text">
                <span className="gear-primary">{it.asset} — {it.location}</span>
                <span className="gear-secondary">With {it.placedBy}</span>
                {it.address && <span className="gear-secondary">{it.address}</span>}
              </div>
              <Badge tone={it.status === "placed" ? "good" : "default"}>
                {it.status === "placed" ? "Still there" : "Brought back"}
              </Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MissionsTab({ data, viewer, adminMode, onAdd, onToggle, onRemove, onUpdateMission }) {
  const list = data.missions.filter((m) => m.assigneeIds.includes(viewer.id));
  const [newOccasion, setNewOccasion] = useState(data.occasions[0]);
  const [newDirective, setNewDirective] = useState("");
  const missingLocations = list.filter((m) => m.kind !== "seeding" && !m.location.trim()).length;
  const nameOf = (id) => data.roster.find((r) => r.id === id)?.name;
  const quotaSummary = computeQuotaSummary(data).filter((q) => q.planned > 0);

  return (
    <div className="tab-content">
      <section className="quota-strip">
        {quotaSummary.map((q) => (
          <div key={q.occasion} className="quota-chip">
            <span className="quota-cat">{q.occasion}</span>
            <span className="quota-num">{q.remainingToDo}<span className="quota-of">/{q.planned}</span></span>
          </div>
        ))}
      </section>

      <section className="card" id="tour-missions-card">
        <div className="card-head">
          <h2>{viewer.name}'s missions</h2>
          <Badge tone={list.every((m) => m.status === "completed") && list.length ? "good" : "default"}>
            {list.filter((m) => m.status === "completed").length} of {list.length} complete
          </Badge>
        </div>

        {list.length === 0 && <p className="muted empty-hint">No missions assigned yet.</p>}
        {missingLocations > 0 && adminMode && (
          <p className="muted empty-hint">
            <AlertCircle size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
            {missingLocations} mission{missingLocations > 1 ? "s" : ""} still need a location — tap to suggest one.
          </p>
        )}

        <ul className="mission-list">
          {list.map((m) => {
            const partnerId = m.assigneeIds.find((id) => id !== viewer.id);
            const done = m.status === "completed";
            // Location is an admin-set suggestion, not something the student
            // picks — this is the "what needs to be planned" view, not the
            // planning app. Seeding is the one exception: its "location"
            // field is really a self-reported cans-placed count, which is
            // the student's own report of work done, same as checking a
            // mission off.
            const canEditField = adminMode || m.kind === "seeding";
            return (
              <li key={m.id} className={`mission-row ${done ? "mission-done" : ""}`}>
                <button className="mission-check" onClick={() => onToggle(m.id)}>
                  {done ? <CheckCircle2 size={19} /> : <Circle size={19} />}
                </button>
                <div className="mission-text">
                  <span className="mission-cat">{m.occasion}</span>
                  {m.directive && <span className="mission-directive">{m.directive}</span>}
                  {canEditField ? (
                    <input
                      className="mission-note-input"
                      type={m.kind === "seeding" ? "number" : "text"}
                      min={m.kind === "seeding" ? "0" : undefined}
                      value={m.location}
                      placeholder={m.kind === "seeding" ? "Cans placed" : "Suggested location…"}
                      onChange={(e) => onUpdateMission(m.id, { location: e.target.value })}
                    />
                  ) : (
                    <span className="mission-note">
                      {m.kind === "seeding"
                        ? (m.location ? `${m.location} cans placed` : "No cans logged yet")
                        : (m.location || "No location suggested yet")}
                    </span>
                  )}
                  {(m.date || partnerId) && (
                    <span className="mission-secondary">
                      {m.date}{m.date && partnerId && " · "}{partnerId && `with ${nameOf(partnerId)}`}
                    </span>
                  )}
                </div>
                {adminMode && (
                  <IconBtn danger title="Remove mission" onClick={() => onRemove(m.id)}>
                    <Trash2 size={15} />
                  </IconBtn>
                )}
              </li>
            );
          })}
        </ul>

        {adminMode && (
          <div className="add-row">
            <select className="text-input select-input" value={newOccasion} onChange={(e) => setNewOccasion(e.target.value)}>
              {data.occasions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              className="text-input"
              placeholder="Directive (event, note from the FMS)"
              value={newDirective}
              onChange={(e) => setNewDirective(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { onAdd(newOccasion, [viewer.id], newDirective.trim()); setNewDirective(""); }
              }}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { onAdd(newOccasion, [viewer.id], newDirective.trim()); setNewDirective(""); }}
            >
              <Plus size={14} /> Assign
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function GearTab({
  viewer, placedByName, inventory, placedAssets, missionContacts, clothingStock,
  onAdd, onRemove, onAddAsset, onRemoveAsset, onToggleAssetStatus, onAddContact, onRemoveContact,
}) {
  const stockLine = CLOTHING_SIZES.map((s) => `${s} ${clothingStock[s] ?? 0}`).join(" · ");

  return (
    <div className="tab-content">
      <PlacedAssetsSection
        items={placedAssets}
        placedByName={placedByName}
        onAdd={onAddAsset}
        onRemove={onRemoveAsset}
        onToggleStatus={onToggleAssetStatus}
      />

      <GearSection
        title="Mission contacts"
        icon={<Users size={16} />}
        items={missionContacts}
        fields={[
          { key: "name", placeholder: "Contact name", required: true },
          { key: "phone", placeholder: "Phone" },
          { key: "email", placeholder: "Email" },
          { key: "address", placeholder: "Address" },
          { key: "venue", placeholder: "Venue / what they do" },
        ]}
        onAdd={(item) => onAddContact(item)}
        onRemove={(id) => onRemoveContact(id)}
        renderItem={(it) => (
          <>
            <span className="gear-primary">{it.name}</span>
            {it.venue && <span className="gear-secondary">{it.venue}</span>}
            {(it.phone || it.email) && <span className="gear-notes">{[it.phone, it.email].filter(Boolean).join(" · ")}</span>}
          </>
        )}
      />

      <GearSection
        title="Clothing in possession"
        icon={<Shirt size={16} />}
        items={inventory.clothing}
        fields={[
          { key: "item", placeholder: "Item (e.g. team tee, jacket)", required: true },
          { key: "size", placeholder: "Size" },
          { key: "qty", placeholder: "Qty" },
        ]}
        onAdd={(item) => onAdd(viewer.id, "clothing", item)}
        onRemove={(id) => onRemove(viewer.id, "clothing", id)}
        renderItem={(it) => (
          <>
            <span className="gear-primary">{it.item}</span>
            {it.size && <span className="gear-secondary">Size {it.size}</span>}
            {it.qty && <span className="gear-notes">Qty {it.qty}</span>}
          </>
        )}
        subtitle={`Team stock on hand — ${stockLine}`}
      />

      <GearSection
        title="Other gear"
        icon={<Package size={16} />}
        items={inventory.other}
        fields={[
          { key: "item", placeholder: "Item (cooler, cart, tent, etc.)", required: true },
          { key: "notes", placeholder: "Condition / notes" },
        ]}
        onAdd={(item) => onAdd(viewer.id, "other", item)}
        onRemove={(id) => onRemove(viewer.id, "other", id)}
        renderItem={(it) => (
          <>
            <span className="gear-primary">{it.item}</span>
            {it.notes && <span className="gear-notes">{it.notes}</span>}
          </>
        )}
      />
    </div>
  );
}

function PlacedAssetsSection({ items, placedByName, onAdd, onRemove, onToggleStatus }) {
  const blankForm = { asset: ASSET_TYPES[0], location: "", address: "", notes: "" };
  const [form, setForm] = useState(blankForm);
  const [adding, setAdding] = useState(false);

  function submit() {
    if (!form.location.trim()) return;
    onAdd({ ...form, placedBy: placedByName, status: "placed" });
    setForm(blankForm);
    setAdding(false);
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2><Refrigerator size={16} /> Placed assets</h2>
        <Badge>{items.length}</Badge>
      </div>
      <p className="muted empty-hint">Team-wide log of fridges, barrels, and other equipment out in the field.</p>

      {items.length === 0 && !adding && <p className="muted empty-hint">Nothing logged yet.</p>}

      <ul className="gear-list">
        {items.map((it) => (
          <li key={it.id} className="gear-row">
            <div className="gear-text">
              <span className="gear-primary">{it.asset} — {it.location}</span>
              {it.address && <span className="gear-secondary">{it.address}</span>}
              <span className="gear-secondary">Placed by {it.placedBy}</span>
              {it.notes && <span className="gear-notes">{it.notes}</span>}
            </div>
            <div className="gear-actions">
              <Badge tone={it.status === "placed" ? "good" : "default"}>
                {it.status === "placed" ? "Still there" : "Brought back"}
              </Badge>
              <button className="btn btn-ghost btn-sm" onClick={() => onToggleStatus(it.id)}>
                {it.status === "placed" ? "Mark retrieved" : "Mark placed"}
              </button>
              <IconBtn danger title="Remove" onClick={() => onRemove(it.id)}><Trash2 size={14} /></IconBtn>
            </div>
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="add-row add-row-wrap">
          <select className="text-input select-input-sm" value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })}>
            {ASSET_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <input className="text-input" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} onKeyDown={(e) => e.key === "Enter" && submit()} />
          <input className="text-input" placeholder="Address (optional)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} onKeyDown={(e) => e.key === "Enter" && submit()} />
          <input className="text-input" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} onKeyDown={(e) => e.key === "Enter" && submit()} />
          <button className="btn btn-primary btn-sm" onClick={submit}><Plus size={14} /> Add</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setForm(blankForm); }}>Cancel</button>
        </div>
      ) : (
        <button className="link-add" onClick={() => setAdding(true)}><Plus size={14} /> Log a placement</button>
      )}
    </section>
  );
}

function GearSection({ title, icon, items, fields, onAdd, onRemove, renderItem, subtitle }) {
  const [form, setForm] = useState({});
  const [adding, setAdding] = useState(false);

  function submit() {
    const required = fields.find((f) => f.required);
    if (required && !form[required.key]?.trim()) return;
    onAdd(form);
    setForm({});
    setAdding(false);
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>{icon} {title}</h2>
        <Badge>{items.length}</Badge>
      </div>
      {subtitle && <p className="muted empty-hint">{subtitle}</p>}

      {items.length === 0 && !adding && <p className="muted empty-hint">Nothing logged yet.</p>}

      <ul className="gear-list">
        {items.map((it) => (
          <li key={it.id} className="gear-row">
            <div className="gear-text">{renderItem(it)}</div>
            <IconBtn danger title="Remove" onClick={() => onRemove(it.id)}><Trash2 size={14} /></IconBtn>
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="add-row add-row-wrap">
          {fields.map((f) => (
            <input
              key={f.key}
              className="text-input"
              placeholder={f.placeholder}
              value={form[f.key] || ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          ))}
          <button className="btn btn-primary btn-sm" onClick={submit}><Plus size={14} /> Add</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setForm({}); }}>Cancel</button>
        </div>
      ) : (
        <button className="link-add" onClick={() => setAdding(true)}><Plus size={14} /> Log an item</button>
      )}
    </section>
  );
}

// Confirmation modal for rolling into a new month — spells out exactly what
// moves to read-only history vs. what resets vs. what carries over, so
// there's no ambiguity about what clicking "Start month" is about to do.
// Admin-side management for RB-hosted volunteer opportunities — posting one
// here is what makes it show up on everyone's Dashboard with a sign-up
// button. Also lets admin log a volunteer directly (e.g. someone who texted
// in instead of using the app) without needing that person to sign in.
function OpportunitiesCard({ opportunities, roster, onAdd, onRemove, onToggleVolunteer }) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [addPerson, setAddPerson] = useState({});
  const today = new Date().toISOString().slice(0, 10);

  function submit() {
    if (!title.trim()) return;
    onAdd(title.trim(), details.trim(), date, location.trim());
    setTitle(""); setDetails(""); setDate(""); setLocation("");
  }

  return (
    <section className="card" id="tour-opportunities-card">
      <div className="card-head"><h2><Megaphone size={16} /> Volunteer opportunities</h2><Badge>{opportunities.length}</Badge></div>
      <p className="muted empty-hint">
        RB-hosted events you need SMs to volunteer for — post one and it shows up on everyone's dashboard with a
        sign-up button. Handy alongside texting people directly, since either way it lands in one shared list.
      </p>

      <div className="gen-inputs" style={{ marginBottom: 12 }}>
        <input className="text-input" placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="text-input" placeholder="Details (optional)" value={details} onChange={(e) => setDetails(e.target.value)} />
        <input className="text-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="text-input" placeholder="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <button className="btn btn-primary btn-sm" disabled={!title.trim()} onClick={submit}>
        <Plus size={14} /> Post opportunity
      </button>

      {opportunities.length > 0 && (
        <ul className="opportunity-list" style={{ marginTop: 16 }}>
          {opportunities.map((o) => (
            <li key={o.id} className="opportunity-row">
              <div className="opportunity-text">
                <span className="opportunity-title">
                  {o.title}
                  {o.date && o.date < today && <Badge>Past — no longer shown to the team</Badge>}
                </span>
                {o.details && <span className="opportunity-details">{o.details}</span>}
                {(o.date || o.location) && (
                  <span className="mission-secondary">{o.date}{o.date && o.location && " · "}{o.location}</span>
                )}
                <div className="opportunity-chips">
                  {o.volunteerIds.length === 0 && <span className="muted" style={{ fontSize: 12.5 }}>No one signed up yet</span>}
                  {o.volunteerIds.map((pid) => (
                    <span key={pid} className="opportunity-chip">
                      {roster.find((r) => r.id === pid)?.name || "Someone"}
                      <button title="Remove" onClick={() => onToggleVolunteer(o.id, pid)}><X size={11} /></button>
                    </span>
                  ))}
                </div>
                <div className="add-row" style={{ marginTop: 8 }}>
                  <select
                    className="text-input select-input select-input-sm"
                    value={addPerson[o.id] || ""}
                    onChange={(e) => setAddPerson({ ...addPerson, [o.id]: e.target.value })}
                  >
                    <option value="">Log a volunteer…</option>
                    {roster.filter((r) => !o.volunteerIds.includes(r.id)).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={!addPerson[o.id]}
                    onClick={() => { onToggleVolunteer(o.id, addPerson[o.id]); setAddPerson({ ...addPerson, [o.id]: "" }); }}
                  >
                    <UserPlus size={13} /> Add
                  </button>
                </div>
              </div>
              <IconBtn danger title="Remove opportunity" onClick={() => onRemove(o.id)}><Trash2 size={14} /></IconBtn>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StartNewMonthModal({ currentLabel, missionCount, currentKey, onCancel, onConfirm }) {
  const suggested = nextMonthKeyAndLabel(currentKey);
  const [label, setLabel] = useState(suggested.label);

  return (
    <Modal onClose={onCancel} title="Start new month">
      <p className="muted">
        This closes out <strong>{currentLabel}</strong> and starts a new month.
      </p>
      <ul className="start-month-list">
        <li>{missionCount} mission{missionCount === 1 ? "" : "s"} from {currentLabel} move to read-only history — nothing is deleted, and they stay exportable.</li>
        <li>The monthly can goal and both deadline dates reset to blank, so you enter this month's real numbers.</li>
        <li>Occasion splits, favorites, roster, priorities, and clothing stock carry over — splits stay editable in the generator whenever the mix changes.</li>
      </ul>
      <label className="gen-field" style={{ marginTop: 4 }}>
        <span>New month label</span>
        <input className="text-input" autoFocus value={label} onChange={(e) => setLabel(e.target.value)} />
      </label>
      <button
        className="btn btn-primary"
        disabled={!label.trim()}
        onClick={() => {
          // If they typed a real month ("November 2026"), key the new month
          // to that so history sorts and reads right; anything else (a
          // nickname, a typo) just rolls to next month.
          const parsed = parseMonthLabel(label);
          onConfirm(parsed && parsed !== currentKey ? parsed : suggested.key, label.trim());
        }}
      >
        <CalendarPlus size={14} /> Start {label.trim() || "month"}
      </button>
      <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
    </Modal>
  );
}

// Read-only record of months that have been closed out via "Start new
// month" — the missions themselves are never deleted, just no longer part
// of any active view, so this is the one place left to look them up.
function MonthHistoryCard({ monthHistory, allMissions, roster, onExport }) {
  const [viewing, setViewing] = useState(null);
  const nameOf = (id) => roster.find((r) => r.id === id)?.name || "Unassigned";
  const sorted = [...monthHistory].sort((a, b) => b.month.localeCompare(a.month));

  if (sorted.length === 0) return null;

  const viewingMissions = viewing ? allMissions.filter((m) => m.month === viewing.month) : [];
  const tally = {};
  viewingMissions.forEach((m) => {
    if (!tally[m.occasion]) tally[m.occasion] = { total: 0, completed: 0 };
    tally[m.occasion].total += 1;
    if (m.status === "completed") tally[m.occasion].completed += 1;
  });

  return (
    <section className="card" id="tour-month-history-card">
      <div className="card-head"><h2><History size={16} /> Past months</h2><Badge>{sorted.length}</Badge></div>
      <p className="muted empty-hint">Read-only — closed-out months, kept for the record. Nothing here can be edited.</p>
      <ul className="month-history-list">
        {sorted.map((h) => {
          const count = allMissions.filter((m) => m.month === h.month).length;
          const done = allMissions.filter((m) => m.month === h.month && m.status === "completed").length;
          return (
            <li key={h.month} className="month-history-row">
              <span className="month-history-label">{h.label}</span>
              <span className="muted">{done}/{count} complete</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewing(h)}>View</button>
            </li>
          );
        })}
      </ul>

      {viewing && (
        <Modal onClose={() => setViewing(null)} title={viewing.label}>
          <div className="quota-table quota-table-2col">
            <div className="quota-table-head"><span>Occasion</span><span>Complete</span></div>
            {Object.entries(tally).map(([occasion, t]) => (
              <div className="quota-table-row quota-table-row-readonly" key={occasion}>
                <span>{occasion}</span><span>{t.completed}/{t.total}</span>
              </div>
            ))}
            {Object.keys(tally).length === 0 && <p className="muted empty-hint">No missions were recorded this month.</p>}
          </div>
          <ul className="month-history-missions">
            {viewingMissions.map((m) => (
              <li key={m.id} className="month-history-mission-row">
                <span>{m.assigneeIds.length ? m.assigneeIds.map(nameOf).join(" & ") : "Unassigned"}</span>
                <span className="muted">{m.occasion}</span>
                <Badge tone={m.status === "completed" ? "good" : "default"}>{m.status}</Badge>
              </li>
            ))}
          </ul>
          <button className="btn btn-ghost btn-sm" onClick={() => onExport(viewing.month, viewing.label)}>
            <Download size={14} /> Export CSV
          </button>
        </Modal>
      )}
    </section>
  );
}

// Admin-only scoreboard: Hunter's real corporate goal per month (set up
// front for the year) against what actually came in (filled in once a
// month closes). Deliberately not wired to missions/cases at all — this is
// reported truth, not a computed rollup.
function YearlyCanGoalEditor({ yearlyCanGoals, onUpdate }) {
  const [local, setLocal] = useState(yearlyCanGoals);
  useEffect(() => { setLocal(yearlyCanGoals); }, [yearlyCanGoals]);

  function setMonthField(i, field, value) {
    const months = local.months.map((m, idx) => (idx === i ? { ...m, [field]: value } : m));
    const next = { ...local, months };
    setLocal(next);
    onUpdate(next);
  }

  const progress = computeYearlyCanProgress(local);

  return (
    <section className="card" id="tour-yearly-goal-card">
      <div className="card-head">
        <h2>Yearly can goal</h2>
        <Badge tone={!progress.hasData ? "default" : progress.onPace ? "good" : "bad"}>
          {progress.actualToDate.toLocaleString()} / {progress.totalGoal.toLocaleString()} cans
        </Badge>
      </div>
      <p className="muted empty-hint">
        Goal is the corporate target for each month; fill in Actual once real numbers come back for that month —
        leave it blank until then. Feeds the "how we square up" bar on the dashboard.
      </p>
      <div className="yearly-goal-table">
        <div className="yearly-goal-table-head">
          <span>Month</span><span>Goal</span><span>Actual</span>
        </div>
        {local.months.map((m, i) => (
          <div className="yearly-goal-table-row" key={MONTH_LABELS[i]}>
            <span>{MONTH_LABELS[i]}</span>
            <input
              className="text-input"
              type="number" min="0"
              value={m.goal ?? 0}
              onChange={(e) => setMonthField(i, "goal", Math.max(0, parseInt(e.target.value || "0", 10)))}
            />
            <input
              className="text-input"
              type="number" min="0"
              placeholder="Not in yet"
              value={m.actual ?? ""}
              onChange={(e) => setMonthField(i, "actual", e.target.value === "" ? null : Math.max(0, parseInt(e.target.value, 10)))}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function TeamTab({
  data, allMissions, monthHistory, clothingStock, onRemoveMember, onExport, onStartNewMonth, onUpdateMeta, onUpdatePlanningConfig, onUpdateYearlyCanGoals, onUpdatePriority,
  onAddOccasion, onRemoveOccasion, generatePreview, onPreviewGenerate, onConfirmGenerate, onCancelGenerate,
  addMember, onUpdateClothingStock, onAddMission, onUpdateMission, onRemoveMission, onToggleMissionDone, isPastMissionsDue,
  onAddOpportunity, onRemoveOpportunity, onToggleVolunteer,
}) {
  // null when not editing. Seeded from `data` at the moment Edit is clicked
  // (not on mount) so it can never write back values from before a "Start
  // new month" or a teammate's synced edit.
  const [metaDraft, setMetaDraft] = useState(null);
  const [newName, setNewName] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeConfirmText, setRemoveConfirmText] = useState("");
  const [startingMonth, setStartingMonth] = useState(false);

  return (
    <div className="tab-content">
      <section className="card" id="tour-planning-header">
        <div className="card-head">
          <h2>Planning header</h2>
          <div className="card-head-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setStartingMonth(true)}>
              <CalendarPlus size={14} /> Start new month
            </button>
            {metaDraft ? (
              <IconBtn
                title="Save"
                onClick={() => {
                  onUpdateMeta({
                    monthLabel: metaDraft.monthLabel.trim() || data.monthLabel,
                    windowNote: metaDraft.windowNote,
                    deadlines: { missionsDue: metaDraft.missionsDue || null },
                  });
                  setMetaDraft(null);
                }}
              >
                <Save size={15} />
              </IconBtn>
            ) : (
              <IconBtn
                title="Edit"
                onClick={() => setMetaDraft({ monthLabel: data.monthLabel, windowNote: data.windowNote || "", missionsDue: data.deadlines?.missionsDue || "" })}
              >
                <Pencil size={15} />
              </IconBtn>
            )}
          </div>
        </div>
        {metaDraft ? (
          <div className="meta-edit">
            <input className="text-input" value={metaDraft.monthLabel} onChange={(e) => setMetaDraft({ ...metaDraft, monthLabel: e.target.value })} placeholder="Month label" />
            <input className="text-input" value={metaDraft.windowNote} onChange={(e) => setMetaDraft({ ...metaDraft, windowNote: e.target.value })} placeholder="Deadline note" />
            <label className="gen-field">
              <span>Missions due</span>
              <input className="text-input" type="date" value={metaDraft.missionsDue} onChange={(e) => setMetaDraft({ ...metaDraft, missionsDue: e.target.value })} />
            </label>
          </div>
        ) : (
          <>
            <p className="muted">{data.windowNote}</p>
            {isPastMissionsDue && <p className="muted"><AlertCircle size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Past the missions-due date ({data.deadlines.missionsDue}).</p>}
          </>
        )}
      </section>

      <YearlyCanGoalEditor
        yearlyCanGoals={data.yearlyCanGoals || emptyYearlyCanGoals()}
        onUpdate={onUpdateYearlyCanGoals}
      />

      {startingMonth && (
        <StartNewMonthModal
          currentLabel={data.monthLabel}
          missionCount={data.missions.length}
          currentKey={data.month}
          onCancel={() => setStartingMonth(false)}
          onConfirm={(key, label) => { onStartNewMonth(key, label); setStartingMonth(false); }}
        />
      )}

      <OccasionsEditor occasions={data.occasions} missions={data.missions} onAdd={onAddOccasion} onRemove={onRemoveOccasion} />

      <PlanGenerator
        config={data.planningConfig}
        roster={data.roster}
        occasions={data.occasions}
        onUpdateConfig={onUpdatePlanningConfig}
        onGenerate={onPreviewGenerate}
      />

      {generatePreview && (
        <Modal onClose={onCancelGenerate} title="Generate plan">
          <p className="muted">
            This will replace {generatePreview.removedCount} untouched draft{generatePreview.removedCount === 1 ? "" : "s"} with{" "}
            {generatePreview.toAdd.length} freshly generated one{generatePreview.toAdd.length === 1 ? "" : "s"}.
            {generatePreview.keptCount > 0 && ` ${generatePreview.keptCount} mission${generatePreview.keptCount === 1 ? "" : "s"} you've already touched will be kept exactly as-is.`}
          </p>
          <button className="btn btn-primary" onClick={onConfirmGenerate}>Apply</button>
          <button className="btn btn-ghost" onClick={onCancelGenerate}>Cancel</button>
        </Modal>
      )}

      <section className="card" id="tour-quotas-card">
        <div className="card-head">
          <h2>Mission quotas</h2>
          <button className="btn btn-ghost btn-sm" onClick={onExport}><Download size={14} /> Export CSV</button>
        </div>
        <p className="muted empty-hint">Read-only — computed live from the missions below (and the split percentages above).</p>
        <div className="quota-table quota-table-4col">
          <div className="quota-table-head">
            <span>Occasion</span><span>Planned</span><span>Assigned</span><span>Remaining</span>
          </div>
          {computeQuotaSummary(data).map((q) => (
            <div className="quota-table-row quota-table-row-readonly" key={q.occasion}>
              <span>{q.occasion}</span><span>{q.planned}</span><span>{q.assigned}</span><span>{q.remaining}</span>
            </div>
          ))}
        </div>
      </section>

      <MissionsPlanTable
        team={data}
        onUpdateMission={onUpdateMission}
        onRemoveMission={onRemoveMission}
        onAddMission={onAddMission}
        onToggleMissionDone={onToggleMissionDone}
      />

      <MonthHistoryCard monthHistory={monthHistory} allMissions={allMissions} roster={data.roster} onExport={onExport} />

      <OpportunitiesCard
        opportunities={data.volunteerOpportunities || []}
        roster={data.roster}
        onAdd={onAddOpportunity}
        onRemove={onRemoveOpportunity}
        onToggleVolunteer={onToggleVolunteer}
      />

      <section className="card" id="tour-clothing-stock">
        <div className="card-head"><h2>Clothing stock</h2></div>
        <p className="muted empty-hint">How many of each size you have on hand to hand out.</p>
        <div className="gen-inputs">
          {CLOTHING_SIZES.map((size) => (
            <label className="gen-field" key={size}>
              <span>{size}</span>
              <input
                className="text-input text-input-num"
                type="number" min="0"
                value={clothingStock?.[size] ?? 0}
                onChange={(e) => onUpdateClothingStock(size, Math.max(0, parseInt(e.target.value || "0", 10)))}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="card" id="tour-roster-manage-card">
        <div className="card-head"><h2>Roster &amp; priority</h2><Badge>{data.roster.length}</Badge></div>
        <p className="muted empty-hint">Priority controls how missions are divided when you generate a plan — higher priority means a bigger share.</p>
        <ul className="roster-manage-list">
          {data.roster.map((p) => (
            <li key={p.id} className="roster-manage-row">
              <span>{p.name}</span>
              <div className="roster-manage-actions">
                <select
                  className="text-input select-input select-input-sm"
                  value={p.priority || 2}
                  onChange={(e) => onUpdatePriority(p.id, parseInt(e.target.value, 10))}
                >
                  <option value={1}>Low priority</option>
                  <option value={2}>Standard</option>
                  <option value={3}>High priority</option>
                </select>
                <IconBtn danger title="Remove from team" onClick={() => { setRemoveTarget(p); setRemoveConfirmText(""); }}>
                  <Trash2 size={14} />
                </IconBtn>
              </div>
            </li>
          ))}
        </ul>
        <div className="add-row" style={{ marginTop: 12 }}>
          <input
            className="text-input"
            placeholder="Add teammate by name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) { addMember(newName.trim()); setNewName(""); } }}
          />
          <button className="btn btn-primary btn-sm" onClick={() => { if (newName.trim()) { addMember(newName.trim()); setNewName(""); } }}>
            <Plus size={14} /> Add
          </button>
        </div>
      </section>

      {removeTarget && (
        <Modal onClose={() => setRemoveTarget(null)} title="Remove teammate">
          <p className="muted">
            This permanently deletes <strong>{removeTarget.name}</strong>'s missions and gear log. This can't be undone.
          </p>
          <p className="muted">
            Type <strong>{removeTarget.name}</strong> to confirm.
          </p>
          <input
            className="text-input"
            autoFocus
            value={removeConfirmText}
            onChange={(e) => setRemoveConfirmText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && removeConfirmText === removeTarget.name) {
                onRemoveMember(removeTarget.id);
                setRemoveTarget(null);
              }
            }}
            placeholder={removeTarget.name}
          />
          <button
            className="btn btn-danger"
            disabled={removeConfirmText !== removeTarget.name}
            onClick={() => { onRemoveMember(removeTarget.id); setRemoveTarget(null); }}
          >
            <Trash2 size={14} /> Remove {removeTarget.name}
          </button>
        </Modal>
      )}
    </div>
  );
}

function PlanGenerator({ config, roster, occasions, onUpdateConfig, onGenerate }) {
  const [local, setLocal] = useState(config);
  // `local` only exists so the inputs stay responsive; the committed config
  // is the source of truth. Re-sync whenever it changes underneath us —
  // "Start new month" zeroing the goal, or a teammate's edit arriving via
  // the focus refetch — otherwise the next keystroke here would spread the
  // stale copy back over the fresh one and resurrect the old numbers.
  useEffect(() => { setLocal(config); }, [config]);
  const [pinPerson, setPinPerson] = useState(roster[0]?.id || "");
  const [pinOccasion, setPinOccasion] = useState(occasions[0]);
  const [pinCount, setPinCount] = useState(1);
  const totalPct = occasions.reduce((s, c) => s + (Number(local.splits[c]) || 0), 0);
  const totalMissions = Math.max(0, Math.round((local.totalCases || 0) / (local.casesPerMission || 1)));

  function setField(field, value) {
    const next = { ...local, [field]: value };
    setLocal(next);
    onUpdateConfig(next);
  }
  function setCansField(field, value) {
    const next = { ...local, [field]: value };
    next.totalCases = Math.round((next.cansGoal || 0) / (next.cansPerCase || 1));
    setLocal(next);
    onUpdateConfig(next);
  }
  function setSplit(occasion, value) {
    const next = { ...local, splits: { ...local.splits, [occasion]: Number(value) } };
    setLocal(next);
    onUpdateConfig(next);
  }
  function normalize() {
    if (totalPct === 0) return;
    const scaled = {};
    occasions.forEach((c) => { scaled[c] = Math.round(((local.splits[c] || 0) / totalPct) * 100); });
    const next = { ...local, splits: scaled };
    setLocal(next);
    onUpdateConfig(next);
  }
  function addPin() {
    if (!pinPerson) return;
    const next = { ...local, pins: [...(local.pins || []), { id: uid("pin"), personId: pinPerson, occasion: pinOccasion, count: Math.max(1, pinCount) }] };
    setLocal(next);
    onUpdateConfig(next);
  }
  function removePin(id) {
    const next = { ...local, pins: (local.pins || []).filter((p) => p.id !== id) };
    setLocal(next);
    onUpdateConfig(next);
  }

  return (
    <section className="card generator-card" id="tour-generator-card">
      <div className="card-head">
        <h2>Generate this month's plan</h2>
        <Badge tone="good">{totalMissions} missions from {local.totalCases || 0} cases</Badge>
      </div>
      <p className="muted empty-hint">
        Enter what corporate gave you to distribute, and the split each pillar should get. Generating creates draft
        (location-TBD) missions to fill the gap between the target and what you've already touched — anything you've
        edited, assigned a location to, or completed is always kept, never overwritten. Favorites picked below get
        guaranteed first; the rest are split randomly by priority.
      </p>

      <div className="gen-inputs">
        <label className="gen-field">
          <span>Monthly can goal</span>
          <input
            className="text-input"
            type="number" min="0"
            value={local.cansGoal ?? 0}
            onChange={(e) => setCansField("cansGoal", Math.max(0, parseInt(e.target.value || "0", 10)))}
          />
        </label>
        <label className="gen-field">
          <span>Cans per case</span>
          <input
            className="text-input"
            type="number" min="1"
            value={local.cansPerCase ?? 24}
            onChange={(e) => setCansField("cansPerCase", Math.max(1, parseInt(e.target.value || "1", 10)))}
          />
        </label>
        <label className="gen-field">
          <span>Cases per mission</span>
          <input
            className="text-input"
            type="number" min="1"
            value={local.casesPerMission}
            onChange={(e) => setField("casesPerMission", Math.max(1, parseInt(e.target.value || "1", 10)))}
          />
        </label>
      </div>
      <p className="muted empty-hint" style={{ marginTop: -6 }}>
        = {local.totalCases || 0} cases this month
      </p>

      <div className="split-head">
        <span>Pillar split</span>
        <span className={`split-total ${totalPct === 100 ? "split-ok" : "split-warn"}`}>
          {totalPct}% total {totalPct !== 100 && <button className="link-add" onClick={normalize}>normalize</button>}
        </span>
      </div>
      <div className="split-grid">
        {occasions.map((c) => (
          <label className="split-row" key={c}>
            <span>{c}</span>
            <div className="split-input-wrap">
              <input
                className="text-input text-input-num"
                type="number" min="0" max="100"
                value={local.splits[c] || 0}
                onChange={(e) => setSplit(c, e.target.value)}
              />
              <span className="split-pct-sign">%</span>
            </div>
          </label>
        ))}
      </div>

      <div id="tour-favorites">
        <div className="split-head" style={{ marginTop: 16 }}>
          <span>Favorites (optional)</span>
        </div>
        <p className="muted empty-hint">Guarantee specific people get specific occasions before the rest are split randomly.</p>
        {(local.pins || []).length > 0 && (
          <ul className="roster-manage-list">
            {(local.pins || []).map((pin) => {
              const person = roster.find((p) => p.id === pin.personId);
              return (
                <li key={pin.id} className="roster-manage-row">
                  <span>{person ? person.name : "Unknown"} — {pin.count}× {pin.occasion}</span>
                  <IconBtn danger title="Remove favorite" onClick={() => removePin(pin.id)}><Trash2 size={14} /></IconBtn>
                </li>
              );
            })}
          </ul>
        )}
        <div className="add-row">
          <select className="text-input select-input select-input-sm" value={pinPerson} onChange={(e) => setPinPerson(e.target.value)}>
            {roster.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="text-input select-input select-input-sm" value={pinOccasion} onChange={(e) => setPinOccasion(e.target.value)}>
            {occasions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            className="text-input text-input-num"
            type="number" min="1"
            value={pinCount}
            onChange={(e) => setPinCount(Math.max(1, parseInt(e.target.value || "1", 10)))}
          />
          <button className="btn btn-ghost btn-sm" onClick={addPin}><Plus size={14} /> Pin favorite</button>
        </div>
      </div>

      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={onGenerate}>
        Preview generated plan
      </button>
    </section>
  );
}

function OccasionsEditor({ occasions, missions, onAdd, onRemove }) {
  const [newName, setNewName] = useState("");
  function submit() {
    const name = newName.trim();
    if (name && !occasions.includes(name)) { onAdd(name); setNewName(""); }
  }
  return (
    <section className="card" id="tour-occasions-card">
      <div className="card-head"><h2>Occasions</h2><Badge>{occasions.length}</Badge></div>
      <p className="muted empty-hint">The pillars this team plans against — splits and every occasion picker below pull from this list.</p>
      <ul className="roster-manage-list">
        {occasions.map((o) => {
          const inUse = missions.some((m) => m.occasion === o);
          return (
            <li key={o} className="roster-manage-row">
              <span>{o}</span>
              <IconBtn
                danger
                title={inUse ? "Can't remove — missions still use this occasion" : "Remove occasion"}
                onClick={() => !inUse && onRemove(o)}
              >
                <Trash2 size={14} style={inUse ? { opacity: 0.35 } : undefined} />
              </IconBtn>
            </li>
          );
        })}
      </ul>
      <div className="add-row" style={{ marginTop: 12 }}>
        <input
          className="text-input"
          placeholder="New occasion name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button className="btn btn-primary btn-sm" onClick={submit}><Plus size={14} /> Add</button>
      </div>
    </section>
  );
}

// The admin-facing dense, filterable, inline-editable table of every real
// mission — this is the spreadsheet's per-SM × occasion matrix, made
// editable, and the primary way an admin hand-tunes a generated draft.
function MissionsPlanTable({ team, onUpdateMission, onRemoveMission, onAddMission, onToggleMissionDone }) {
  const [occasionFilter, setOccasionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [newPerson, setNewPerson] = useState(team.roster[0]?.id || "");
  const [newOccasion, setNewOccasion] = useState(team.occasions[0]);
  const [newDirective, setNewDirective] = useState("");

  const nameOf = (id) => team.roster.find((r) => r.id === id)?.name || "";

  const rows = team.missions
    .filter((m) => occasionFilter === "all" || m.occasion === occasionFilter)
    .filter((m) => statusFilter === "all" || m.status === statusFilter)
    .filter((m) => !unassignedOnly || m.assigneeIds.length === 0)
    .slice()
    .sort((a, b) => (nameOf(a.assigneeIds[0]) || "￿").localeCompare(nameOf(b.assigneeIds[0]) || "￿") || a.occasion.localeCompare(b.occasion));

  return (
    <section className="card" id="tour-plan-table-card">
      <div className="card-head"><h2>Missions</h2><Badge>{team.missions.length}</Badge></div>
      <p className="muted empty-hint">Every mission, editable inline. Rows with a blue edge are untouched generator drafts — they're the only ones a re-generate will replace.</p>

      <div className="plan-filters">
        <select className="text-input select-input select-input-sm" value={occasionFilter} onChange={(e) => setOccasionFilter(e.target.value)}>
          <option value="all">All occasions</option>
          {team.occasions.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select className="text-input select-input select-input-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="edited">Edited</option>
          <option value="completed">Completed</option>
        </select>
        <label className="plan-filter-toggle">
          <input type="checkbox" checked={unassignedOnly} onChange={(e) => setUnassignedOnly(e.target.checked)} />
          Unassigned only
        </label>
      </div>

      {rows.length === 0 && <p className="muted empty-hint">No missions match these filters.</p>}

      {rows.length > 0 && (
        <div className="plan-table">
          <div className="plan-table-head">
            <span>Person</span><span>Occasion</span><span>Directive</span><span>Partner</span><span>Date</span><span>Location</span><span>Done</span><span />
          </div>
          {rows.map((m) => {
            const primary = m.assigneeIds[0] || "";
            const partnerId = m.assigneeIds[1] || "";
            return (
              <div className={`plan-table-row ${m.status === "draft" ? "plan-row-draft" : ""}`} key={m.id}>
                <select
                  className="text-input select-input select-input-sm"
                  value={primary}
                  onChange={(e) => onUpdateMission(m.id, { assigneeIds: [e.target.value, partnerId].filter(Boolean) })}
                >
                  <option value="">— Unassigned —</option>
                  {team.roster.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select
                  className="text-input select-input select-input-sm"
                  value={m.occasion}
                  onChange={(e) => onUpdateMission(m.id, { occasion: e.target.value, kind: occasionKind(e.target.value) })}
                >
                  {team.occasions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <input
                  className="text-input"
                  value={m.directive}
                  placeholder="Directive"
                  onChange={(e) => onUpdateMission(m.id, { directive: e.target.value })}
                />
                <select
                  className="text-input select-input select-input-sm"
                  value={partnerId}
                  onChange={(e) => onUpdateMission(m.id, { assigneeIds: [primary, e.target.value].filter(Boolean) })}
                >
                  <option value="">No partner</option>
                  {team.roster.filter((p) => p.id !== primary).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input className="text-input" type="date" value={m.date} onChange={(e) => onUpdateMission(m.id, { date: e.target.value })} />
                <input
                  className="text-input"
                  value={m.location}
                  placeholder="Location"
                  onChange={(e) => onUpdateMission(m.id, { location: e.target.value })}
                />
                <button
                  className="mission-check"
                  title={m.status === "completed" ? "Mark not done" : "Mark done"}
                  onClick={() => onToggleMissionDone(m.id)}
                >
                  {m.status === "completed" ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </button>
                <IconBtn danger title="Delete mission" onClick={() => onRemoveMission(m.id)}><Trash2 size={14} /></IconBtn>
              </div>
            );
          })}
        </div>
      )}

      <div className="add-row" style={{ marginTop: 12 }}>
        <select className="text-input select-input select-input-sm" value={newPerson} onChange={(e) => setNewPerson(e.target.value)}>
          <option value="">— Unassigned —</option>
          {team.roster.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="text-input select-input select-input-sm" value={newOccasion} onChange={(e) => setNewOccasion(e.target.value)}>
          {team.occasions.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <input
          className="text-input"
          placeholder="Directive (optional)"
          value={newDirective}
          onChange={(e) => setNewDirective(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onAddMission(newOccasion, newPerson ? [newPerson] : [], newDirective.trim()); setNewDirective(""); }
          }}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { onAddMission(newOccasion, newPerson ? [newPerson] : [], newDirective.trim()); setNewDirective(""); }}
        >
          <Plus size={14} /> Add mission
        </button>
      </div>
    </section>
  );
}

function PortalStyles() {
  return (
    <style>{`
      .portal-root {
        --paper: #F8F8F8;
        --ink: #000F1E;
        --ink-soft: rgba(0,15,30,0.6);
        --line: rgba(0,15,30,0.12);
        --accent: #1B6AEE;
        --accent-soft: #E5EEFD;
        --success: #12873F;
        --success-soft: #E8F5ED;
        --danger: #DB0A40;
        --danger-soft: #FBE6EC;
        --navy: #001C39;
        --card: #FFFFFF;
        font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        background: var(--paper);
        color: var(--ink);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
      .portal-loading {
        align-items: center;
        justify-content: center;
        flex-direction: row;
        gap: 10px;
        padding: 60px 0;
        color: var(--ink-soft);
      }
      .spin { animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }

      .top-bar {
        display: flex;
        align-items: center;
        gap: 24px;
        padding: 12px 20px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        background: var(--navy);
        color: #fff;
        flex-wrap: wrap;
      }
      .brand { display: flex; align-items: center; gap: 10px; }
      .brand-clickable { cursor: pointer; border-radius: 8px; }
      .brand-clickable:hover { opacity: 0.85; }
      .team-switcher {
        background: rgba(255,255,255,0.08);
        border: 1.5px solid rgba(255,255,255,0.25);
        color: #fff;
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 12.5px;
        font-weight: 500;
        cursor: pointer;
      }
      .team-switcher:hover { border-color: rgba(255,255,255,0.5); }
      .team-switcher option { color: var(--ink); }
      .top-nav { display: flex; align-items: center; gap: 4px; flex: 1; }
      .top-nav-btn {
        display: flex; align-items: center; gap: 6px;
        padding: 8px 16px;
        border-radius: 999px;
        border: none;
        background: transparent;
        color: rgba(255,255,255,0.7);
        font-size: 13.5px;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
      }
      .top-nav-btn:hover { color: #fff; background: rgba(255,255,255,0.06); }
      .top-nav-btn-active { background: rgba(255,255,255,0.12); color: #fff; font-weight: 600; }
      .brand-title {
        font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-weight: 700;
        font-size: 17px;
        letter-spacing: 0.01em;
        line-height: 1.1;
        color: #fff;
      }
      .brand-sub { font-size: 12px; color: rgba(255,255,255,0.65); margin-top: 2px; }
      .top-actions { display: flex; align-items: center; gap: 8px; }

      .save-indicator {
        font-size: 12px;
        color: rgba(255,255,255,0.65);
        display: flex;
        align-items: center;
        gap: 5px;
        margin-right: 4px;
      }
      .save-ok { color: #6ee7a8; }
      .top-bar .btn-ghost { border-color: rgba(255,255,255,0.3); color: #fff; }
      .top-bar .btn-ghost:hover { border-color: #fff; background: rgba(255,255,255,0.08); }
      .top-bar .icon-btn { border-color: rgba(255,255,255,0.3); color: rgba(255,255,255,0.85); }
      .top-bar .icon-btn:hover { border-color: #fff; color: #fff; }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        padding: 8px 16px;
        font-size: 13.5px;
        font-weight: 500;
        border: 1.5px solid var(--ink);
        background: transparent;
        color: var(--ink);
        cursor: pointer;
        transition: transform 0.08s ease, background 0.15s ease;
      }
      .btn:active { transform: scale(0.97); }
      .btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .btn-ghost { border-color: var(--line); }
      .btn-ghost:hover { border-color: var(--ink); }
      .btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
      .btn-primary:hover { background: #1552bd; }
      .btn-danger { background: var(--danger); border-color: var(--danger); color: #fff; margin-top: 4px; }
      .btn-danger:hover { background: #b30836; }
      .btn-sm { padding: 6px 12px; font-size: 12.5px; }

      .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px; height: 30px;
        border-radius: 999px;
        border: 1.5px solid var(--line);
        background: transparent;
        color: var(--ink-soft);
        cursor: pointer;
      }
      .icon-btn:hover { border-color: var(--ink); color: var(--ink); }
      .icon-btn-danger:hover { border-color: var(--danger); color: var(--danger); }

      .body-grid {
        display: flex;
        flex: 1;
        min-height: 560px;
      }

      .roster-rail {
        width: 220px;
        flex-shrink: 0;
        border-right: 1px solid var(--line);
        padding: 20px 14px;
        background: var(--card);
      }
      .rail-label {
        font-size: 11px;
        color: var(--ink-soft);
        letter-spacing: 0.04em;
        margin: 0 6px 8px;
      }
      .roster-item {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 9px 10px;
        border-radius: 999px;
        border: none;
        background: transparent;
        color: var(--ink);
        font-size: 13.5px;
        text-align: left;
        cursor: pointer;
        margin-bottom: 2px;
      }
      .roster-item:hover { background: var(--accent-soft); }
      .roster-item-active { background: var(--accent); color: #fff; font-weight: 600; }
      .roster-item-dashboard { margin-bottom: 14px; font-weight: 500; }
      .roster-item-dashboard .roster-name { gap: 8px; }
      .roster-name { display: flex; align-items: center; gap: 6px; }
      .you-tag {
        font-size: 10px;
        background: rgba(0,0,0,0.15);
        padding: 1px 6px;
        border-radius: 20px;
      }
      .sm-type-tag {
        font-size: 10px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        opacity: 0.55;
      }
      .roster-progress { font-family: 'IBM Plex Mono', monospace; font-size: 12px; opacity: 0.75; }
      .rail-add {
        display: flex; align-items: center; gap: 6px;
        margin-top: 10px; padding: 8px 10px;
        border: 1.5px dashed var(--line);
        border-radius: 8px;
        background: transparent;
        color: var(--ink-soft);
        font-size: 12.5px;
        cursor: pointer;
        width: 100%;
      }
      .rail-add:hover { border-color: var(--ink); color: var(--ink); }
      .rail-add-form { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
      .sm-type-picker { display: flex; gap: 6px; }
      .sm-type-option {
        flex: 1; font-size: 11.5px; padding: 5px 0; border-radius: 7px;
        border: 1px solid var(--line); background: #fff; color: var(--ink-soft);
        cursor: pointer;
      }
      .sm-type-option-active { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); font-weight: 600; }

      .main-panel { flex: 1; padding: 24px 28px 32px; overflow-y: auto; }

      .empty-state {
        display: flex; flex-direction: column; align-items: center; gap: 10px;
        padding: 60px 0; color: var(--ink-soft);
      }

      .tab-content { display: flex; flex-direction: column; gap: 24px; }

      .quota-strip { display: flex; flex-wrap: wrap; gap: 10px; }
      .quota-chip {
        background: var(--card);
        border: none;
        box-shadow: 0 1px 2px rgba(0,15,30,0.06), 0 1px 12px rgba(0,15,30,0.04);
        border-radius: 12px;
        padding: 10px 14px;
        display: flex; flex-direction: column; gap: 2px;
        min-width: 84px;
      }
      .quota-cat { font-size: 11px; color: var(--ink-soft); }
      .quota-num { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 15px; }
      .quota-of { font-size: 11px; color: var(--ink-soft); font-weight: 400; }

      .card {
        background: var(--card);
        border: none;
        box-shadow: 0 1px 2px rgba(0,15,30,0.06), 0 1px 16px rgba(0,15,30,0.05);
        border-radius: 16px;
        padding: 22px 24px 24px;
      }
      .card-head {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 16px;
      }
      .card-head-actions { display: flex; align-items: center; gap: 8px; }
      .card-head h2 {
        font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 15.5px;
        font-weight: 700;
        margin: 0;
        display: flex; align-items: center; gap: 7px;
      }
      .muted { color: var(--ink-soft); font-size: 13.5px; }
      .start-month-list { margin: 0; padding-left: 18px; color: var(--ink-soft); font-size: 13.5px; display: flex; flex-direction: column; gap: 6px; }
      .empty-hint { margin: 4px 0 12px; }

      .badge {
        font-size: 11.5px;
        font-weight: 600;
        padding: 3px 9px;
        border-radius: 20px;
        background: var(--line);
        color: var(--ink-soft);
      }
      .badge-good { background: var(--success-soft); color: var(--success); }
      .badge-bad { background: var(--danger-soft); color: var(--danger); }

      .mission-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      .mission-row {
        display: flex; align-items: flex-start; gap: 10px;
        padding: 10px 8px;
        border-radius: 8px;
        border-bottom: 1px solid var(--line);
      }
      .mission-row:last-child { border-bottom: none; }
      .mission-done { opacity: 0.55; }
      .mission-done .mission-note, .mission-done .mission-cat { text-decoration: line-through; }
      .mission-check { background: none; border: none; color: var(--accent); cursor: pointer; padding: 0; margin-top: 1px; }
      .mission-text { display: flex; flex-direction: column; gap: 2px; flex: 1; }
      .mission-cat { font-weight: 600; font-size: 13.5px; }
      .mission-note { font-size: 12.5px; color: var(--ink-soft); }

      .add-row { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
      .add-row-wrap { flex-wrap: wrap; }
      .text-input {
        border: 1.5px solid var(--line);
        border-radius: 7px;
        padding: 8px 10px;
        font-size: 13px;
        font-family: inherit;
        background: #fff;
        color: var(--ink);
        flex: 1;
        min-width: 120px;
      }
      .text-input:focus { outline: none; border-color: var(--accent); }
      .text-input-sm { padding: 6px 9px; font-size: 12.5px; }
      .text-input-num { max-width: 76px; flex: none; font-family: 'IBM Plex Mono', monospace; }
      .select-input { flex: none; min-width: 150px; }

      .gear-list { list-style: none; margin: 0 0 10px; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      .gear-row {
        display: flex; align-items: center; justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        padding: 10px 14px;
        border: none;
        box-shadow: 0 1px 2px rgba(0,15,30,0.06), 0 1px 10px rgba(0,15,30,0.04);
        border-radius: 10px;
        background: #fff;
      }
      .gear-text { display: flex; flex-direction: column; gap: 1px; }
      .gear-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
      .gear-primary { font-weight: 600; font-size: 13.5px; }
      .gear-secondary { font-size: 12px; color: var(--ink-soft); }
      .gear-notes { font-size: 11.5px; color: var(--ink-soft); font-style: italic; }

      .link-add {
        display: inline-flex; align-items: center; gap: 6px;
        background: none; border: none; color: var(--accent);
        font-size: 13px; font-weight: 600; cursor: pointer; padding: 4px 0;
      }

      .quota-table { display: flex; flex-direction: column; gap: 4px; }
      .quota-table-head, .quota-table-row {
        display: grid; grid-template-columns: 1fr 84px 84px; gap: 10px; align-items: center;
      }
      .quota-table-head { font-size: 11px; color: var(--ink-soft); padding: 0 2px 4px; }
      .quota-table-row { padding: 5px 2px; border-bottom: 1px solid var(--line); font-size: 13.5px; }
      .quota-table-4col .quota-table-head, .quota-table-4col .quota-table-row { grid-template-columns: 1fr 64px 64px 64px; }
      .quota-table-2col .quota-table-head, .quota-table-2col .quota-table-row { grid-template-columns: 1fr 84px; }
      .quota-table-row-readonly { color: var(--ink-soft); }
      .quota-table-row-readonly span:first-child { color: var(--ink); }
      .month-history-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
      .month-history-row {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        padding: 9px 2px; border-bottom: 1px solid var(--line); font-size: 13.5px;
      }
      .month-history-row:last-child { border-bottom: none; }
      .month-history-label { font-weight: 600; flex: 1; }
      .month-history-missions { list-style: none; margin: 0; padding: 0; max-height: 260px; overflow-y: auto; }
      .month-history-mission-row {
        display: flex; align-items: center; gap: 10px; padding: 6px 2px;
        border-bottom: 1px solid var(--line); font-size: 13px;
      }
      .month-history-mission-row > span:first-child { flex: 1; font-weight: 600; }
      .opportunity-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
      .opportunity-row {
        display: flex; align-items: center; justify-content: space-between; gap: 14px;
        padding: 12px 2px; border-bottom: 1px solid var(--line);
      }
      .opportunity-row:last-child { border-bottom: none; }
      .opportunity-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
      .opportunity-title { font-weight: 700; font-size: 14px; }
      .opportunity-details { font-size: 12.5px; color: var(--ink-soft); }
      .opportunity-volunteers { margin-top: 2px; }
      .opportunity-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
      .opportunity-chip {
        display: inline-flex; align-items: center; gap: 5px;
        background: rgba(0,15,30,0.06); border-radius: 999px;
        padding: 3px 6px 3px 10px; font-size: 12px; font-weight: 600;
      }
      .opportunity-chip button {
        display: flex; align-items: center; justify-content: center;
        width: 16px; height: 16px; border-radius: 50%; border: none;
        background: transparent; color: var(--ink-soft); cursor: pointer; padding: 0;
      }
      .opportunity-chip button:hover { background: rgba(0,0,0,0.08); color: var(--ink); }

      .plan-filters { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }
      .plan-filter-toggle { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--ink-soft); }
      .plan-table { display: flex; flex-direction: column; gap: 4px; overflow-x: auto; padding-bottom: 4px; }
      .plan-table-head, .plan-table-row {
        display: grid;
        grid-template-columns: minmax(100px, 1.1fr) minmax(100px, 1fr) minmax(130px, 1.6fr) minmax(96px, 1fr) 126px minmax(110px, 1.4fr) 28px 28px;
        gap: 6px; align-items: center; min-width: 760px;
      }
      .plan-table-head > *, .plan-table-row > * { min-width: 0; }
      .plan-table-row .text-input, .plan-table-row .select-input {
        width: 100%; min-width: 0; box-sizing: border-box; flex: none;
        padding: 6px 8px; font-size: 12.5px;
      }
      .plan-table-row .icon-btn { width: 28px; height: 28px; }
      .plan-table-head { font-size: 11px; color: var(--ink-soft); padding: 0 2px 4px; }
      .plan-table-row { padding: 5px 2px; border-bottom: 1px solid var(--line); }
      .plan-row-draft { box-shadow: inset 3px 0 0 rgba(27,106,238,0.45); }
      .plan-row-draft .text-input::placeholder { color: rgba(0,15,30,0.35); }
      .mission-directive { font-size: 12px; color: var(--ink-soft); font-style: italic; }
      .mission-secondary { font-size: 11.5px; color: var(--ink-soft); }
      .overdue-hint { color: var(--danger); }

      .roster-manage-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
      .roster-manage-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 8px 4px; border-bottom: 1px solid var(--line); font-size: 13.5px;
      }
      .roster-manage-actions { display: flex; align-items: center; gap: 8px; }
      .select-input-sm { padding: 6px 8px; font-size: 12.5px; min-width: 118px; flex: none; }

      .mission-note-input {
        border: none;
        border-bottom: 1.5px dashed var(--line);
        background: transparent;
        font-size: 12.5px;
        color: var(--ink-soft);
        padding: 2px 0;
        font-family: inherit;
        width: 100%;
        max-width: 320px;
      }
      .mission-note-input:focus { outline: none; border-color: var(--accent); color: var(--ink); }

      .generator-card { box-shadow: 0 0 0 1.5px var(--accent), 0 1px 16px rgba(0,15,30,0.05); }
      .gen-inputs { display: flex; gap: 14px; flex-wrap: wrap; margin: 10px 0 16px; }
      .gen-field { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--ink-soft); flex: 1; min-width: 160px; }
      .split-head {
        display: flex; align-items: center; justify-content: space-between;
        font-size: 11px; color: var(--ink-soft); margin-bottom: 6px;
      }
      .split-total { display: flex; align-items: center; gap: 6px; font-weight: 600; }
      .split-ok { color: var(--success); }
      .split-warn { color: var(--danger); }
      .split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
      .split-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; gap: 8px; }
      .split-input-wrap { display: flex; align-items: center; gap: 4px; }
      .split-pct-sign { font-size: 12px; color: var(--ink-soft); }

      @media (max-width: 560px) {
        .split-grid { grid-template-columns: 1fr; }
      }

      .meta-edit { display: flex; flex-direction: column; gap: 8px; }

      .modal-backdrop {
        position: fixed; inset: 0; background: rgba(20,20,20,0.45);
        display: flex; align-items: center; justify-content: center;
        z-index: 50; padding: 20px;
      }
      .modal-card {
        background: var(--card, #FFFFFF);
        border-radius: 14px;
        width: 100%; max-width: 380px;
        padding: 18px 20px 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      }
      .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
      .modal-head h3 { margin: 0; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; }
      .modal-body { display: flex; flex-direction: column; gap: 10px; }
      .error-text { display: flex; align-items: center; gap: 5px; color: var(--danger); font-size: 12.5px; }

      .identity-list { display: flex; flex-direction: column; gap: 4px; margin: 6px 0 12px; }
      .identity-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 11px 14px; border-radius: 10px;
        border: none;
        box-shadow: 0 1px 2px rgba(0,15,30,0.06), 0 1px 10px rgba(0,15,30,0.04);
        background: #fff; font-size: 13.5px; font-weight: 500;
        cursor: pointer;
      }
      .identity-row:hover { border-color: var(--accent, #1B6AEE); }
      .identity-row-admin {
        background: var(--navy, #001C39);
        color: #fff;
        margin-bottom: 4px;
      }
      .identity-row-admin:hover { background: #00284d; }
      .identity-admin-label { display: flex; align-items: center; gap: 7px; }
      .identity-new { display: flex; gap: 8px; }

      .app-footer {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px; flex-wrap: wrap;
        padding: 12px 20px;
        border-top: 1px solid var(--line);
        background: var(--card);
      }
      .footer-note { font-size: 12px; }
      .footer-actions { display: flex; align-items: center; gap: 8px; }

      .dashboard-progress-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
      .dashboard-progress-row {
        display: flex; align-items: center; gap: 14px;
        width: 100%;
        padding: 9px 8px;
        border-radius: 8px;
        border: none; background: none;
        cursor: pointer;
        text-align: left;
      }
      .dashboard-progress-row:hover { background: var(--paper); }
      .dashboard-progress-name { flex: 0 0 170px; font-size: 13.5px; font-weight: 500; display: flex; align-items: center; gap: 6px; }
      .dashboard-progress-bar-wrap { flex: 1; height: 8px; border-radius: 999px; background: var(--line); overflow: hidden; display: block; }
      .dashboard-progress-bar { display: block; height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.3s ease; }
      .yearly-goal-bar-wrap { height: 14px; border-radius: 999px; background: var(--line); overflow: hidden; margin: 4px 0 10px; }
      .yearly-goal-bar { display: block; height: 100%; border-radius: 999px; transition: width 0.3s ease; }
      .yearly-goal-bar-good { background: var(--success); }
      .yearly-goal-bar-bad { background: var(--danger); }
      .yearly-goal-table { display: flex; flex-direction: column; gap: 2px; margin-top: 10px; }
      .yearly-goal-table-head, .yearly-goal-table-row { display: grid; grid-template-columns: 64px 1fr 1fr; gap: 10px; align-items: center; }
      .yearly-goal-table-head { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-soft); padding: 0 2px 4px; }
      .yearly-goal-table-row { padding: 3px 0; }

      .dashboard-stats { display: flex; gap: 32px; flex-wrap: wrap; }
      .dashboard-stat { display: flex; flex-direction: column; gap: 2px; }
      .dashboard-stat-num { font-family: 'IBM Plex Mono', monospace; font-size: 22px; font-weight: 700; }
      .dashboard-stat-label { font-size: 12px; color: var(--ink-soft); }


      .tour-clickblock { position: fixed; inset: 0; z-index: 9997; }
      .tour-spotlight {
        position: fixed; z-index: 9997;
        border-radius: 10px;
        pointer-events: none;
        box-shadow: 0 0 0 3px var(--accent), 0 0 0 9999px rgba(10,16,28,0.6);
        transition: top 0.2s ease, left 0.2s ease, width 0.2s ease, height 0.2s ease;
      }
      .tour-card {
        position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%);
        z-index: 9998;
        width: calc(100% - 40px); max-width: 360px;
        background: var(--card);
        border-radius: 16px;
        padding: 16px 18px 18px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.35);
      }
      .tour-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
      .tour-step-count { font-size: 11px; color: var(--ink-soft); letter-spacing: 0.04em; }
      .tour-card h3 { margin: 0 0 6px; font-size: 15.5px; }
      .tour-card p { margin: 0; font-size: 13.5px; color: var(--ink-soft); line-height: 1.4; }
      .tour-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }

      @media (max-width: 720px) {
        .body-grid { flex-direction: column; }
        .roster-rail { width: 100%; border-right: none; border-bottom: 1px solid var(--line); }
        .roster-rail nav { display: flex; overflow-x: auto; gap: 6px; }
        .roster-item { width: auto; white-space: nowrap; }
        .rail-add, .rail-add-form { display: none; }
        .main-panel { padding: 16px; }
        .quota-table-head, .quota-table-row { grid-template-columns: 1fr 60px 60px; gap: 6px; }
        .quota-table-4col .quota-table-head, .quota-table-4col .quota-table-row { grid-template-columns: 1fr 48px 48px 48px; }
      }
    `}</style>
  );
}
