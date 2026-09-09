import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Truck, Package, ShieldCheck, ShieldOff, CheckCircle2, Circle, Plus, Trash2,
  Lock, Unlock, Download, X, Users, ClipboardList, Shirt, Refrigerator,
  ChevronRight, AlertCircle, Loader2, Pencil, Save, HelpCircle, ArrowLeft,
  LayoutDashboard,
} from "lucide-react";
import storage, {
  hasHostStorage, getStoredPasscode, setStoredPasscode, clearStoredPasscode,
} from "./storage.js";

// ---------- Demo seed data ----------
// NOTE: this currently seeds real teammate names/quotas from the internal
// planning sheet, for a live walkthrough with a manager. Swap back to
// fictional names (see git history) before pushing anywhere public.
const CATEGORY_ORDER = [
  "Study", "Work", "Party & Socialize", "Sports", "Fitness", "Gaming",
  "Sales Support", "University Seeding",
];

function emptyPlanningConfig() {
  return {
    cansGoal: 0,
    cansPerCase: 24,
    totalCases: 0,
    casesPerMission: 15,
    splits: Object.fromEntries(CATEGORY_ORDER.map((c) => [c, 0])),
    pins: [],
  };
}

function emptyCatalog() {
  return CATEGORY_ORDER.map((category, i) => ({ id: `c${i}`, category, available: 0, remaining: 0 }));
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
const ASSET_TYPES = ["Mini Fridge", "E-Barrel", "Ice Barrel", "DJ Desk", "Other"];
const CLOTHING_SIZES = ["S", "M", "L", "XL"];

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
    body: "Check missions off as you complete them, and fill in the location once you've picked one.",
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
    title: "Team leads: admin mode",
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
    body: "Set the month label and the deadline note shown to the whole team. You can also edit the month directly from the top bar.",
  },
  {
    target: "#tour-generator-card",
    setup: (ctx) => ctx.setTab("team"),
    title: "Generate the plan",
    body: "Enter the total cases you were given and the percentage split across categories — this is what determines how many missions get created and of what kind.",
  },
  {
    target: "#tour-favorites",
    setup: (ctx) => ctx.setTab("team"),
    title: "Favorites",
    body: "Pin a specific category to a specific person before generating — useful when someone's asked for more of something they like. Everything left over is still split randomly by priority.",
  },
  {
    target: "#tour-quotas-card",
    setup: (ctx) => ctx.setTab("team"),
    title: "Mission quotas",
    body: "These fill in automatically when you generate a plan, but you can fine-tune available/remaining counts by hand here too — and export the current list to CSV.",
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
// any manually-pinned favorites) into a fresh catalog and a fresh set of
// (unassigned-location) mission slots.
function generateMissionPlan(config, roster) {
  const totalMissions = Math.max(0, Math.round(config.totalCases / (config.casesPerMission || 1)));
  const weights = roster.map((p) => p.priority || 1);
  const pins = config.pins || [];

  const catalog = [];
  const assignments = {};
  roster.forEach((p) => { assignments[p.id] = []; });

  CATEGORY_ORDER.forEach((category) => {
    const pct = config.splits[category] || 0;
    const missionsForCategory = Math.round(totalMissions * (pct / 100));
    catalog.push({ id: uid("c"), category, available: missionsForCategory, remaining: missionsForCategory });
    if (missionsForCategory <= 0) return;

    const perPerson = roster.map(() => 0);
    let remaining = missionsForCategory;

    // Guaranteed picks first (e.g. someone who asked for this category).
    pins.filter((pin) => pin.category === category).forEach((pin) => {
      const idx = roster.findIndex((p) => p.id === pin.personId);
      if (idx === -1 || remaining <= 0) return;
      const give = Math.min(pin.count, remaining);
      perPerson[idx] += give;
      remaining -= give;
    });

    if (remaining > 0) {
      const extra = distributeRandomBalanced(remaining, weights);
      extra.forEach((n, idx) => { perPerson[idx] += n; });
    }

    roster.forEach((p, idx) => {
      for (let n = 0; n < perPerson[idx]; n++) {
        assignments[p.id].push({ id: uid("a"), category, note: "", done: false });
      }
    });
  });

  return { catalog, assignments, totalMissions };
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
  const v5 = await loadV5();
  if (v5) return v5;
  const migrated = await migrateFromV4();
  if (migrated) return migrated;
  await writeAllV5(SEED);
  return SEED;
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

async function loadIdentity() {
  try {
    const res = await storage.get("my-marketeer-id", false);
    if (res && res.value) return res.value;
  } catch (e) {}
  return null;
}

async function saveIdentity(id) {
  try {
    await storage.set("my-marketeer-id", id, false);
  } catch (e) {}
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
  const [tab, setTab] = useState("missions");
  const [adminMode, setAdminMode] = useState(false);
  const [showIdentityPicker, setShowIdentityPicker] = useState(false);
  const [editingMonth, setEditingMonth] = useState(false);
  const [monthDraft, setMonthDraft] = useState("");
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

  useEffect(() => {
    if (gateChecking || needsPasscode) return;
    (async () => {
      const [d, id] = await Promise.all([loadData(), loadIdentity()]);
      lastPersistedRef.current = d;
      setData(d);
      setActiveTeamId(d.teams[0].id);
      const homeTeam = id && d.teams.find((t) => t.roster.find((r) => r.id === id));
      if (homeTeam) {
        setMyId(id);
        setViewId(id);
        setActiveTeamId(homeTeam.id);
      } else {
        setShowIdentityPicker(true);
      }
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

  function saveMonthLabel() {
    if (monthDraft.trim()) commitTeam({ monthLabel: monthDraft.trim() });
    setEditingMonth(false);
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
  const isViewingSelf = viewId === myId;

  function pickIdentity(id) {
    setMyId(id);
    setViewId(id);
    saveIdentity(id);
    setShowIdentityPicker(false);
  }

  // ---- roster mutations (scoped to the active team) ----
  function addMember(name) {
    const id = uid("p");
    commitTeam((t) => ({
      roster: [...t.roster, { id, name }],
      assignments: { ...t.assignments, [id]: [] },
      inventory: { ...t.inventory, [id]: emptyInventory() },
    }));
    return id;
  }

  function removeMember(id) {
    const roster = activeTeam.roster.filter((r) => r.id !== id);
    const assignments = { ...activeTeam.assignments };
    const inventory = { ...activeTeam.inventory };
    delete assignments[id];
    delete inventory[id];
    commitTeam({ roster, assignments, inventory });
    if (viewId === id) setViewId(roster[0] ? roster[0].id : null);
    if (myId === id) {
      setMyId(null);
      saveIdentity("");
    }
  }

  // ---- catalog mutations (scoped to the active team) ----
  function updateCatalog(id, field, value) {
    commitTeam((t) => ({ catalog: t.catalog.map((c) => (c.id === id ? { ...c, [field]: value } : c)) }));
  }

  function updatePlanningConfig(next) {
    commitTeam({ planningConfig: next });
  }

  function updatePriority(personId, priority) {
    commitTeam((t) => ({ roster: t.roster.map((p) => (p.id === personId ? { ...p, priority } : p)) }));
  }

  function runGeneratePlan() {
    const { catalog, assignments } = generateMissionPlan(activeTeam.planningConfig, activeTeam.roster);
    commitTeam({ catalog, assignments });
  }

  function updateAssignmentNote(personId, aid, note) {
    commitTeam((t) => ({
      assignments: { ...t.assignments, [personId]: (t.assignments[personId] || []).map((a) => (a.id === aid ? { ...a, note } : a)) },
    }));
  }

  // ---- assignment mutations (scoped to the active team) ----
  function addAssignment(personId, category, note) {
    commitTeam((t) => ({
      assignments: { ...t.assignments, [personId]: [...(t.assignments[personId] || []), { id: uid("a"), category, note, done: false }] },
    }));
  }

  function toggleAssignment(personId, aid) {
    commitTeam((t) => ({
      assignments: { ...t.assignments, [personId]: (t.assignments[personId] || []).map((a) => (a.id === aid ? { ...a, done: !a.done } : a)) },
    }));
  }

  function removeAssignment(personId, aid) {
    commitTeam((t) => ({
      assignments: { ...t.assignments, [personId]: (t.assignments[personId] || []).filter((a) => a.id !== aid) },
    }));
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

  function exportCsv() {
    const rows = [["Name", "Category", "Note", "Done"]];
    activeTeam.roster.forEach((p) => {
      (activeTeam.assignments[p.id] || []).forEach((a) => {
        rows.push([p.name, a.category, a.note, a.done ? "Yes" : "No"]);
      });
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTeam.monthLabel.replace(/[^\w]+/g, "-")}-missions.csv`;
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
            {adminMode && editingMonth ? (
              <input
                className="text-input month-edit-input"
                autoFocus
                value={monthDraft}
                onChange={(e) => setMonthDraft(e.target.value)}
                onBlur={saveMonthLabel}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveMonthLabel();
                  if (e.key === "Escape") setEditingMonth(false);
                }}
              />
            ) : (
              <div
                id="tour-month-label"
                className={`brand-sub ${adminMode ? "brand-sub-editable" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (adminMode) { setMonthDraft(activeTeam.monthLabel); setEditingMonth(true); }
                }}
              >
                {activeTeam.monthLabel}
                {adminMode && <Pencil size={11} />}
              </div>
            )}
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
              const list = activeTeam.assignments[p.id] || [];
              const done = list.filter((a) => a.done).length;
              return (
                <button
                  key={p.id}
                  className={`roster-item ${viewId === p.id ? "roster-item-active" : ""}`}
                  onClick={() => { setViewId(p.id); setTab("missions"); }}
                >
                  <span className="roster-name">{p.name}{p.id === myId && <span className="you-tag">you</span>}</span>
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
              data={activeTeam}
              myId={myId}
              placedAssets={data.placedAssets || []}
              missionContacts={data.missionContacts || []}
              onSelectPerson={(id) => { setViewId(id); setTab("missions"); }}
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
              data={activeTeam}
              viewer={viewer}
              adminMode={adminMode}
              canEditNotes={adminMode || isViewingSelf}
              onAdd={addAssignment}
              onToggle={toggleAssignment}
              onRemove={removeAssignment}
              onNoteChange={updateAssignmentNote}
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
              data={activeTeam}
              clothingStock={data.clothingStock || {}}
              onUpdateCatalog={updateCatalog}
              onRemoveMember={removeMember}
              onExport={exportCsv}
              onUpdateMeta={(field, value) => commitTeam({ [field]: value })}
              onUpdatePlanningConfig={updatePlanningConfig}
              onUpdatePriority={updatePriority}
              onGeneratePlan={runGeneratePlan}
              addMember={addMember}
              onUpdateClothingStock={updateClothingStock}
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
                {p.name} <ChevronRight size={15} />
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
  if (!open) {
    return (
      <button className="rail-add" onClick={() => setOpen(true)}>
        <Plus size={14} /> Add teammate
      </button>
    );
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
          if (e.key === "Enter" && name.trim()) { onAdd(name.trim()); setName(""); setOpen(false); }
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <button className="btn btn-primary btn-sm" onClick={() => { if (name.trim()) { onAdd(name.trim()); setName(""); setOpen(false); } }}>Add</button>
    </div>
  );
}

function DashboardTab({ data, myId, placedAssets, missionContacts, onSelectPerson }) {
  const roster = data.roster;
  const totalAssigned = roster.reduce((s, p) => s + (data.assignments[p.id] || []).length, 0);
  const totalDone = roster.reduce((s, p) => s + (data.assignments[p.id] || []).filter((a) => a.done).length, 0);
  const stillPlaced = placedAssets.filter((a) => a.status === "placed").length;
  const contacts = missionContacts;

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
      </section>

      <section className="quota-strip">
        {data.catalog.filter((c) => c.available > 0).map((c) => (
          <div key={c.id} className="quota-chip">
            <span className="quota-cat">{c.category}</span>
            <span className="quota-num">{c.remaining}<span className="quota-of">/{c.available}</span></span>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="card-head"><h2><Users size={16} /> Team progress</h2></div>
        <ul className="dashboard-progress-list">
          {roster.map((p) => {
            const list = data.assignments[p.id] || [];
            const done = list.filter((a) => a.done).length;
            const pct = list.length ? Math.round((done / list.length) * 100) : 0;
            return (
              <li key={p.id}>
                <button className="dashboard-progress-row" onClick={() => onSelectPerson(p.id)}>
                  <span className="dashboard-progress-name">
                    {p.name}{p.id === myId && <span className="you-tag">you</span>}
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

function MissionsTab({ data, viewer, adminMode, canEditNotes, onAdd, onToggle, onRemove, onNoteChange }) {
  const list = data.assignments[viewer.id] || [];
  const [newCat, setNewCat] = useState(CATEGORY_ORDER[0]);
  const [newNote, setNewNote] = useState("");
  const missingLocations = list.filter((a) => a.category !== "University Seeding" && !a.note.trim()).length;

  return (
    <div className="tab-content">
      <section className="quota-strip">
        {data.catalog.filter((c) => c.available > 0).map((c) => (
          <div key={c.id} className="quota-chip">
            <span className="quota-cat">{c.category}</span>
            <span className="quota-num">{c.remaining}<span className="quota-of">/{c.available}</span></span>
          </div>
        ))}
      </section>

      <section className="card" id="tour-missions-card">
        <div className="card-head">
          <h2>{viewer.name}'s missions</h2>
          <Badge tone={list.every((a) => a.done) && list.length ? "good" : "default"}>
            {list.filter((a) => a.done).length} of {list.length} complete
          </Badge>
        </div>

        {list.length === 0 && <p className="muted empty-hint">No missions assigned yet.</p>}
        {missingLocations > 0 && canEditNotes && (
          <p className="muted empty-hint">
            <AlertCircle size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
            {missingLocations} mission{missingLocations > 1 ? "s" : ""} still need a location — tap to add one.
          </p>
        )}

        <ul className="mission-list">
          {list.map((a) => (
            <li key={a.id} className={`mission-row ${a.done ? "mission-done" : ""}`}>
              <button className="mission-check" onClick={() => onToggle(viewer.id, a.id)}>
                {a.done ? <CheckCircle2 size={19} /> : <Circle size={19} />}
              </button>
              <div className="mission-text">
                <span className="mission-cat">{a.category}</span>
                {canEditNotes ? (
                  a.category === "University Seeding" ? (
                    <input
                      className="mission-note-input"
                      type="number" min="0"
                      value={a.note}
                      placeholder="Cans placed"
                      onChange={(e) => onNoteChange(viewer.id, a.id, e.target.value)}
                    />
                  ) : (
                    <input
                      className="mission-note-input"
                      value={a.note}
                      placeholder="Add a location or detail…"
                      onChange={(e) => onNoteChange(viewer.id, a.id, e.target.value)}
                    />
                  )
                ) : (
                  <span className="mission-note">
                    {a.category === "University Seeding"
                      ? (a.note ? `${a.note} cans placed` : "No cans logged yet")
                      : (a.note || "Location TBD")}
                  </span>
                )}
              </div>
              {adminMode && (
                <IconBtn danger title="Remove mission" onClick={() => onRemove(viewer.id, a.id)}>
                  <Trash2 size={15} />
                </IconBtn>
              )}
            </li>
          ))}
        </ul>

        {adminMode && (
          <div className="add-row">
            <select className="text-input select-input" value={newCat} onChange={(e) => setNewCat(e.target.value)}>
              {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              className="text-input"
              placeholder="Mission detail (location, notes)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newNote.trim()) { onAdd(viewer.id, newCat, newNote.trim()); setNewNote(""); }
              }}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { if (newNote.trim()) { onAdd(viewer.id, newCat, newNote.trim()); setNewNote(""); } }}
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

function TeamTab({ data, clothingStock, onUpdateCatalog, onRemoveMember, onExport, onUpdateMeta, onUpdatePlanningConfig, onUpdatePriority, onGeneratePlan, addMember, onUpdateClothingStock }) {
  const [editingMeta, setEditingMeta] = useState(false);
  const [monthLabel, setMonthLabel] = useState(data.monthLabel);
  const [windowNote, setWindowNote] = useState(data.windowNote);
  const [newName, setNewName] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeConfirmText, setRemoveConfirmText] = useState("");

  return (
    <div className="tab-content">
      <section className="card" id="tour-planning-header">
        <div className="card-head">
          <h2>Planning header</h2>
          {editingMeta ? (
            <IconBtn title="Save" onClick={() => { onUpdateMeta("monthLabel", monthLabel); onUpdateMeta("windowNote", windowNote); setEditingMeta(false); }}>
              <Save size={15} />
            </IconBtn>
          ) : (
            <IconBtn title="Edit" onClick={() => setEditingMeta(true)}><Pencil size={15} /></IconBtn>
          )}
        </div>
        {editingMeta ? (
          <div className="meta-edit">
            <input className="text-input" value={monthLabel} onChange={(e) => setMonthLabel(e.target.value)} placeholder="Month label" />
            <input className="text-input" value={windowNote} onChange={(e) => setWindowNote(e.target.value)} placeholder="Deadline note" />
          </div>
        ) : (
          <p className="muted">{data.windowNote}</p>
        )}
      </section>

      <PlanGenerator
        config={data.planningConfig}
        roster={data.roster}
        onUpdateConfig={onUpdatePlanningConfig}
        onUpdatePriority={onUpdatePriority}
        onGenerate={onGeneratePlan}
      />

      <section className="card" id="tour-quotas-card">
        <div className="card-head">
          <h2>Mission quotas</h2>
          <button className="btn btn-ghost btn-sm" onClick={onExport}><Download size={14} /> Export CSV</button>
        </div>
        <p className="muted empty-hint">These update automatically when you generate a plan above — or fine-tune them by hand here.</p>
        <div className="quota-table">
          <div className="quota-table-head">
            <span>Category</span><span>Available</span><span>Remaining</span>
          </div>
          {data.catalog.map((c) => (
            <div className="quota-table-row" key={c.id}>
              <span>{c.category}</span>
              <input
                className="text-input text-input-num"
                type="number"
                min="0"
                value={c.available}
                onChange={(e) => onUpdateCatalog(c.id, "available", Math.max(0, parseInt(e.target.value || "0", 10)))}
              />
              <input
                className="text-input text-input-num"
                type="number"
                min="0"
                value={c.remaining}
                onChange={(e) => onUpdateCatalog(c.id, "remaining", Math.max(0, parseInt(e.target.value || "0", 10)))}
              />
            </div>
          ))}
        </div>
      </section>

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

function PlanGenerator({ config, roster, onUpdateConfig, onUpdatePriority, onGenerate }) {
  const [local, setLocal] = useState(config);
  const [pinPerson, setPinPerson] = useState(roster[0]?.id || "");
  const [pinCategory, setPinCategory] = useState(CATEGORY_ORDER[0]);
  const [pinCount, setPinCount] = useState(1);
  const totalPct = CATEGORY_ORDER.reduce((s, c) => s + (Number(local.splits[c]) || 0), 0);
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
  function setSplit(category, value) {
    const next = { ...local, splits: { ...local.splits, [category]: Number(value) } };
    setLocal(next);
    onUpdateConfig(next);
  }
  function normalize() {
    if (totalPct === 0) return;
    const scaled = {};
    CATEGORY_ORDER.forEach((c) => { scaled[c] = Math.round(((local.splits[c] || 0) / totalPct) * 100); });
    const next = { ...local, splits: scaled };
    setLocal(next);
    onUpdateConfig(next);
  }
  function addPin() {
    if (!pinPerson) return;
    const next = { ...local, pins: [...(local.pins || []), { id: uid("pin"), personId: pinPerson, category: pinCategory, count: Math.max(1, pinCount) }] };
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
        Enter what corporate gave you to distribute, and the split each pillar should get. This replaces the current
        quotas and creates fresh (location-TBD) mission slots — favorites picked below get guaranteed first, the
        rest are split randomly by priority so no one's stuck with none (or all) of one category.
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
        {CATEGORY_ORDER.map((c) => (
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
        <p className="muted empty-hint">Guarantee specific people get specific categories before the rest are split randomly.</p>
        {(local.pins || []).length > 0 && (
          <ul className="roster-manage-list">
            {(local.pins || []).map((pin) => {
              const person = roster.find((p) => p.id === pin.personId);
              return (
                <li key={pin.id} className="roster-manage-row">
                  <span>{person ? person.name : "Unknown"} — {pin.count}× {pin.category}</span>
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
          <select className="text-input select-input select-input-sm" value={pinCategory} onChange={(e) => setPinCategory(e.target.value)}>
            {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
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

      <button
        className="btn btn-primary"
        style={{ marginTop: 14 }}
        onClick={() => {
          if (confirm("This replaces current mission quotas and every assigned mission (locations included). Continue?")) {
            onGenerate();
          }
        }}
      >
        Generate &amp; distribute missions
      </button>
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
      .card-head h2 {
        font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 15.5px;
        font-weight: 700;
        margin: 0;
        display: flex; align-items: center; gap: 7px;
      }
      .muted { color: var(--ink-soft); font-size: 13.5px; }
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

      .dashboard-stats { display: flex; gap: 32px; flex-wrap: wrap; }
      .dashboard-stat { display: flex; flex-direction: column; gap: 2px; }
      .dashboard-stat-num { font-family: 'IBM Plex Mono', monospace; font-size: 22px; font-weight: 700; }
      .dashboard-stat-label { font-size: 12px; color: var(--ink-soft); }

      .brand-sub-editable { cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
      .brand-sub-editable:hover { color: #fff; }
      .month-edit-input { margin-top: 2px; padding: 3px 8px; font-size: 12px; width: 180px; }

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
      }
    `}</style>
  );
}
