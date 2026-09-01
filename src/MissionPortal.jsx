import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Truck, Package, ShieldCheck, ShieldOff, CheckCircle2, Circle, Plus, Trash2,
  Lock, Unlock, Download, X, Users, ClipboardList, Shirt, Refrigerator,
  ChevronRight, AlertCircle, Loader2, Pencil, Save
} from "lucide-react";
import storage from "./storage.js";

// ---------- Demo seed data ----------
// This is deliberately generic/fictional. The version this project was built
// for seeds from a real monthly field-marketing planning sheet (team roster,
// case quotas, per-person assignments); that data stays private and is not
// part of this public repo. Swap SEED below with your own team's shape.
const SEED = {
  monthLabel: "Sample Month \u2014 Demo Team",
  windowNote: "Missions due the 2nd \u00b7 Edits due the 4th",
  adminPasscode: "changeme",
  // Mirrors the "PLANNING FORMULA" section of the original sheet: total cases
  // in, an occasion split, a cases-per-mission constant -> missions needed.
  planningConfig: {
    totalCases: 600,
    casesPerMission: 15,
    splits: {
      "Study": 33,
      "Work": 19,
      "Party & Socialize": 21,
      "Sports": 6,
      "Fitness": 9,
      "Gaming": 12,
      "Drive": 0,
      "Shopping": 0,
      "Leisure": 0,
      "Sales Support": 0,
      "University Seeding": 0,
    },
  },
  catalog: [
    { id: "c1", category: "Study", available: 10, remaining: 1 },
    { id: "c2", category: "Work", available: 6, remaining: 2 },
    { id: "c3", category: "Party & Socialize", available: 6, remaining: 0 },
    { id: "c4", category: "Sports", available: 2, remaining: 0 },
    { id: "c5", category: "Fitness", available: 3, remaining: 0 },
    { id: "c6", category: "Gaming", available: 3, remaining: 0 },
    { id: "c7", category: "Drive", available: 0, remaining: 0 },
    { id: "c8", category: "Shopping", available: 0, remaining: 0 },
    { id: "c9", category: "Leisure", available: 0, remaining: 0 },
    { id: "c10", category: "Sales Support", available: 2, remaining: 2 },
    { id: "c11", category: "University Seeding", available: 0, remaining: 0 },
  ],
  roster: [
    { id: "p1", name: "Alex Rivera", priority: 2 },
    { id: "p2", name: "Jordan Lee", priority: 2 },
    { id: "p3", name: "Sam Patel", priority: 2 },
    { id: "p4", name: "Taylor Kim", priority: 2 },
    { id: "p5", name: "Morgan Diaz", priority: 2 },
  ],
  assignments: {
    p1: [
      { id: "a1", category: "Study", note: "Main campus library", done: false },
      { id: "a2", category: "Party & Socialize", note: "Homecoming tailgate", done: false },
      { id: "a3", category: "Gaming", note: "Campus esports lounge", done: false },
    ],
    p2: [
      { id: "a4", category: "Study", note: "Study lounge (2x)", done: false },
      { id: "a5", category: "Work", note: "Workplaces of your choice (new venues)", done: false },
      { id: "a6", category: "Party & Socialize", note: "Events of your finding", done: false },
      { id: "a7", category: "Fitness", note: "Gym near west campus", done: false },
    ],
    p3: [
      { id: "a8", category: "Study", note: "Study lounge (2x)", done: false },
      { id: "a9", category: "Work", note: "Workplaces of your choice (new venues)", done: false },
      { id: "a10", category: "Party & Socialize", note: "Events of your finding", done: false },
      { id: "a11", category: "Sports", note: "Local sports event, TBD", done: false },
      { id: "a12", category: "Gaming", note: "Gaming store, during busy hours", done: false },
    ],
    p4: [
      { id: "a13", category: "Study", note: "Study lounge (2x)", done: false },
      { id: "a14", category: "Work", note: "Workplaces of your choice (new venues)", done: false },
      { id: "a15", category: "Party & Socialize", note: "Events of your finding", done: false },
      { id: "a16", category: "Sports", note: "Intramural fields on campus", done: false },
      { id: "a17", category: "Fitness", note: "Fitness event, TBD", done: false },
    ],
    p5: [
      { id: "a18", category: "Study", note: "Study lounge (2x)", done: false },
      { id: "a19", category: "Work", note: "Workplaces of your choice (new venues)", done: false },
      { id: "a20", category: "Party & Socialize", note: "Events of your finding", done: false },
      { id: "a21", category: "Fitness", note: "Fitness places nearby", done: false },
      { id: "a22", category: "Gaming", note: "Gaming store / event", done: false },
    ],
  },
  inventory: {
    p1: { fridges: [], clothing: [], other: [] },
    p2: { fridges: [], clothing: [], other: [] },
    p3: { fridges: [], clothing: [], other: [] },
    p4: { fridges: [], clothing: [], other: [] },
    p5: { fridges: [], clothing: [], other: [] },
  },
};

const STORAGE_KEY = "redbull-mission-portal-v2";
const CATEGORY_ORDER = SEED.catalog.map((c) => c.category);
const PRIORITY_LABELS = { 1: "Low", 2: "Standard", 3: "High" };

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function emptyInventory() {
  return { fridges: [], clothing: [], other: [] };
}

// ---------- Planning-formula engine ----------
// Splits `total` whole units across `weights` (one weight per recipient) so
// the shares add back up to `total` exactly, using largest-remainder rounding.
function allocateByWeight(total, weights) {
  const sumW = weights.reduce((s, w) => s + w, 0);
  if (total <= 0 || sumW <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sumW);
  const floors = raw.map(Math.floor);
  let remainder = total - floors.reduce((s, f) => s + f, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  for (let k = 0; k < order.length && remainder > 0; k++, remainder--) {
    result[order[k].i] += 1;
  }
  return result;
}

// Turns "total cases this month" + occasion splits + team priorities into a
// fresh catalog and a fresh set of (unassigned-location) mission slots.
function generateMissionPlan(config, roster) {
  const totalMissions = Math.max(0, Math.round(config.totalCases / (config.casesPerMission || 1)));
  const weights = roster.map((p) => p.priority || 1);

  const catalog = [];
  const assignments = {};
  roster.forEach((p) => { assignments[p.id] = []; });

  CATEGORY_ORDER.forEach((category) => {
    const pct = config.splits[category] || 0;
    const missionsForCategory = Math.round(totalMissions * (pct / 100));
    catalog.push({ id: uid("c"), category, available: missionsForCategory, remaining: missionsForCategory });
    if (missionsForCategory > 0) {
      const perPerson = allocateByWeight(missionsForCategory, weights);
      roster.forEach((p, idx) => {
        for (let n = 0; n < perPerson[idx]; n++) {
          assignments[p.id].push({ id: uid("a"), category, note: "", done: false });
        }
      });
    }
  });

  return { catalog, assignments, totalMissions };
}

// ---------- Storage helpers ----------
async function loadData() {
  try {
    const res = await storage.get(STORAGE_KEY, true);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {
    // not found or error -> fall through to seed
  }
  await storage.set(STORAGE_KEY, JSON.stringify(SEED), true);
  return SEED;
}

async function persist(data) {
  try {
    await storage.set(STORAGE_KEY, JSON.stringify(data), true);
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

export default function MissionPortal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [myId, setMyId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [tab, setTab] = useState("missions");
  const [adminMode, setAdminMode] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [passError, setPassError] = useState("");
  const [showIdentityPicker, setShowIdentityPicker] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const [d, id] = await Promise.all([loadData(), loadIdentity()]);
      setData(d);
      if (id && d.roster.find((r) => r.id === id)) {
        setMyId(id);
        setViewId(id);
      } else {
        setShowIdentityPicker(true);
      }
      setLoading(false);
    })();
  }, []);

  const commit = useCallback((next) => {
    setData(next);
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const ok = await persist(next);
      setSaveState(ok ? "saved" : "idle");
      setTimeout(() => setSaveState("idle"), 1500);
    }, 350);
  }, []);

  if (loading || !data) {
    return (
      <div className="portal-root portal-loading">
        <PortalStyles />
        <Loader2 className="spin" size={22} />
        <span>Loading the manifest\u2026</span>
      </div>
    );
  }

  const viewer = data.roster.find((r) => r.id === viewId) || null;
  const isViewingSelf = viewId === myId;

  function pickIdentity(id) {
    setMyId(id);
    setViewId(id);
    saveIdentity(id);
    setShowIdentityPicker(false);
  }

  function tryUnlock() {
    if (passInput === data.adminPasscode) {
      setAdminMode(true);
      setShowPasscode(false);
      setPassInput("");
      setPassError("");
    } else {
      setPassError("That's not the passcode.");
    }
  }

  // ---- roster mutations ----
  function addMember(name) {
    const id = uid("p");
    const next = {
      ...data,
      roster: [...data.roster, { id, name }],
      assignments: { ...data.assignments, [id]: [] },
      inventory: { ...data.inventory, [id]: emptyInventory() },
    };
    commit(next);
    return id;
  }

  function removeMember(id) {
    const roster = data.roster.filter((r) => r.id !== id);
    const assignments = { ...data.assignments };
    const inventory = { ...data.inventory };
    delete assignments[id];
    delete inventory[id];
    commit({ ...data, roster, assignments, inventory });
    if (viewId === id) setViewId(roster[0] ? roster[0].id : null);
    if (myId === id) {
      setMyId(null);
      saveIdentity("");
    }
  }

  // ---- catalog mutations ----
  function updateCatalog(id, field, value) {
    const catalog = data.catalog.map((c) => (c.id === id ? { ...c, [field]: value } : c));
    commit({ ...data, catalog });
  }

  function updatePlanningConfig(next) {
    commit({ ...data, planningConfig: next });
  }

  function updatePriority(personId, priority) {
    const roster = data.roster.map((p) => (p.id === personId ? { ...p, priority } : p));
    commit({ ...data, roster });
  }

  function runGeneratePlan() {
    const { catalog, assignments } = generateMissionPlan(data.planningConfig, data.roster);
    commit({ ...data, catalog, assignments });
  }

  function updateAssignmentNote(personId, aid, note) {
    const list = (data.assignments[personId] || []).map((a) => (a.id === aid ? { ...a, note } : a));
    commit({ ...data, assignments: { ...data.assignments, [personId]: list } });
  }

  // ---- assignment mutations ----
  function addAssignment(personId, category, note) {
    const list = data.assignments[personId] || [];
    const next = { ...data.assignments, [personId]: [...list, { id: uid("a"), category, note, done: false }] };
    commit({ ...data, assignments: next });
  }

  function toggleAssignment(personId, aid) {
    const list = (data.assignments[personId] || []).map((a) => (a.id === aid ? { ...a, done: !a.done } : a));
    commit({ ...data, assignments: { ...data.assignments, [personId]: list } });
  }

  function removeAssignment(personId, aid) {
    const list = (data.assignments[personId] || []).filter((a) => a.id !== aid);
    commit({ ...data, assignments: { ...data.assignments, [personId]: list } });
  }

  // ---- inventory mutations ----
  function addInventoryItem(personId, bucket, item) {
    const inv = data.inventory[personId] || emptyInventory();
    const nextBucket = [...(inv[bucket] || []), { id: uid("i"), ...item }];
    commit({ ...data, inventory: { ...data.inventory, [personId]: { ...inv, [bucket]: nextBucket } } });
  }

  function removeInventoryItem(personId, bucket, itemId) {
    const inv = data.inventory[personId] || emptyInventory();
    const nextBucket = (inv[bucket] || []).filter((x) => x.id !== itemId);
    commit({ ...data, inventory: { ...data.inventory, [personId]: { ...inv, [bucket]: nextBucket } } });
  }

  function exportCsv() {
    const rows = [["Name", "Category", "Note", "Done"]];
    data.roster.forEach((p) => {
      (data.assignments[p.id] || []).forEach((a) => {
        rows.push([p.name, a.category, a.note, a.done ? "Yes" : "No"]);
      });
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.monthLabel.replace(/[^\w]+/g, "-")}-missions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="portal-root">
      <PortalStyles />

      {showIdentityPicker && (
        <IdentityModal
          roster={data.roster}
          onPick={pickIdentity}
          onCreate={(name) => {
            const id = addMember(name);
            pickIdentity(id);
          }}
        />
      )}

      {showPasscode && (
        <Modal onClose={() => { setShowPasscode(false); setPassError(""); setPassInput(""); }} title="Admin unlock">
          <p className="muted">Enter the team passcode to edit quotas, missions, and roster.</p>
          <input
            className="text-input"
            type="password"
            autoFocus
            value={passInput}
            onChange={(e) => setPassInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
            placeholder="Passcode"
          />
          {passError && <div className="error-text"><AlertCircle size={14} />{passError}</div>}
          <button className="btn btn-primary" onClick={tryUnlock}>Unlock</button>
        </Modal>
      )}

      <header className="top-bar">
        <div className="brand">
          <Truck size={20} strokeWidth={2.2} />
          <div>
            <div className="brand-title">Mission Manifest</div>
            <div className="brand-sub">{data.monthLabel}</div>
          </div>
        </div>
        <div className="top-actions">
          <SaveIndicator state={saveState} />
          {adminMode ? (
            <button className="btn btn-ghost" onClick={() => setAdminMode(false)}>
              <ShieldOff size={15} /> Exit admin
            </button>
          ) : (
            <button className="btn btn-ghost" onClick={() => setShowPasscode(true)}>
              <Lock size={15} /> Admin
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => setShowIdentityPicker(true)}>
            {myId ? data.roster.find((r) => r.id === myId)?.name || "Switch" : "Who are you?"}
          </button>
        </div>
      </header>

      <div className="body-grid">
        <aside className="roster-rail">
          <div className="rail-label">Team</div>
          <nav>
            {data.roster.map((p) => {
              const list = data.assignments[p.id] || [];
              const done = list.filter((a) => a.done).length;
              return (
                <button
                  key={p.id}
                  className={`roster-item ${viewId === p.id ? "roster-item-active" : ""}`}
                  onClick={() => setViewId(p.id)}
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
          <div className="tab-row">
            <TabBtn active={tab === "missions"} onClick={() => setTab("missions")} icon={<ClipboardList size={15} />} label="Missions" />
            <TabBtn active={tab === "gear"} onClick={() => setTab("gear")} icon={<Package size={15} />} label="Gear & placements" />
            {adminMode && <TabBtn active={tab === "team"} onClick={() => setTab("team")} icon={<Users size={15} />} label="Team & quotas" />}
          </div>

          {!viewer && (
            <div className="empty-state">
              <Users size={28} />
              <p>No one's selected. Pick a name from the roster.</p>
            </div>
          )}

          {viewer && tab === "missions" && (
            <MissionsTab
              data={data}
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
              inventory={data.inventory[viewer.id] || emptyInventory()}
              onAdd={addInventoryItem}
              onRemove={removeInventoryItem}
            />
          )}

          {adminMode && tab === "team" && (
            <TeamTab
              data={data}
              onUpdateCatalog={updateCatalog}
              onRemoveMember={removeMember}
              onExport={exportCsv}
              onUpdateMeta={(field, value) => commit({ ...data, [field]: value })}
              onUpdatePlanningConfig={updatePlanningConfig}
              onUpdatePriority={updatePriority}
              onGeneratePlan={runGeneratePlan}
              addMember={addMember}
            />
          )}
        </main>
      </div>
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
    <button className={`tab-btn ${active ? "tab-btn-active" : ""}`} onClick={onClick} type="button">
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

function IdentityModal({ roster, onPick, onCreate }) {
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

function MissionsTab({ data, viewer, adminMode, canEditNotes, onAdd, onToggle, onRemove, onNoteChange }) {
  const list = data.assignments[viewer.id] || [];
  const [newCat, setNewCat] = useState(CATEGORY_ORDER[0]);
  const [newNote, setNewNote] = useState("");
  const missingLocations = list.filter((a) => !a.note.trim()).length;

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

      <section className="card">
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
            {missingLocations} mission{missingLocations > 1 ? "s" : ""} still need a location \u2014 tap to add one.
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
                  <input
                    className="mission-note-input"
                    value={a.note}
                    placeholder="Add a location or detail\u2026"
                    onChange={(e) => onNoteChange(viewer.id, a.id, e.target.value)}
                  />
                ) : (
                  <span className="mission-note">{a.note || "Location TBD"}</span>
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

function GearTab({ viewer, inventory, onAdd, onRemove }) {
  return (
    <div className="tab-content">
      <GearSection
        title="Fridge placements"
        icon={<Refrigerator size={16} />}
        items={inventory.fridges}
        fields={[
          { key: "location", placeholder: "Venue name", required: true },
          { key: "address", placeholder: "Address / campus building" },
          { key: "notes", placeholder: "Notes (restock day, contact, etc.)" },
        ]}
        onAdd={(item) => onAdd(viewer.id, "fridges", item)}
        onRemove={(id) => onRemove(viewer.id, "fridges", id)}
        renderItem={(it) => (
          <>
            <span className="gear-primary">{it.location}</span>
            {it.address && <span className="gear-secondary">{it.address}</span>}
            {it.notes && <span className="gear-notes">{it.notes}</span>}
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

function GearSection({ title, icon, items, fields, onAdd, onRemove, renderItem }) {
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

function TeamTab({ data, onUpdateCatalog, onRemoveMember, onExport, onUpdateMeta, onUpdatePlanningConfig, onUpdatePriority, onGeneratePlan, addMember }) {
  const [editingMeta, setEditingMeta] = useState(false);
  const [monthLabel, setMonthLabel] = useState(data.monthLabel);
  const [windowNote, setWindowNote] = useState(data.windowNote);
  const [newName, setNewName] = useState("");

  return (
    <div className="tab-content">
      <section className="card">
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

      <section className="card">
        <div className="card-head">
          <h2>Mission quotas</h2>
          <button className="btn btn-ghost btn-sm" onClick={onExport}><Download size={14} /> Export CSV</button>
        </div>
        <p className="muted empty-hint">These update automatically when you generate a plan above \u2014 or fine-tune them by hand here.</p>
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

      <section className="card">
        <div className="card-head"><h2>Roster &amp; priority</h2><Badge>{data.roster.length}</Badge></div>
        <p className="muted empty-hint">Priority controls how missions are divided when you generate a plan \u2014 higher priority means a bigger share.</p>
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
                <IconBtn danger title="Remove from team" onClick={() => { if (confirm(`Remove ${p.name} from the team? This deletes their missions and gear log.`)) onRemoveMember(p.id); }}>
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
    </div>
  );
}

function PlanGenerator({ config, roster, onUpdateConfig, onUpdatePriority, onGenerate }) {
  const [local, setLocal] = useState(config);
  const totalPct = CATEGORY_ORDER.reduce((s, c) => s + (Number(local.splits[c]) || 0), 0);
  const totalMissions = Math.max(0, Math.round((local.totalCases || 0) / (local.casesPerMission || 1)));

  function setField(field, value) {
    const next = { ...local, [field]: value };
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

  return (
    <section className="card generator-card">
      <div className="card-head">
        <h2>Generate this month's plan</h2>
        <Badge tone="good">{totalMissions} missions from {local.totalCases || 0} cases</Badge>
      </div>
      <p className="muted empty-hint">
        Enter what corporate gave you to distribute, and the split each pillar should get. This replaces the current
        quotas and creates fresh (location-TBD) mission slots divided across the team by priority.
      </p>

      <div className="gen-inputs">
        <label className="gen-field">
          <span>Cases to distribute this month</span>
          <input
            className="text-input"
            type="number" min="0"
            value={local.totalCases}
            onChange={(e) => setField("totalCases", Math.max(0, parseInt(e.target.value || "0", 10)))}
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
        --paper: #F2EEE3;
        --ink: #1C2333;
        --ink-soft: #4B5265;
        --line: #D9D3C2;
        --rust: #C1440E;
        --rust-soft: #F0D9CB;
        --teal: #2F6F68;
        --teal-soft: #DCEAE7;
        --card: #FBFAF6;
        font-family: 'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif;
        background: var(--paper);
        color: var(--ink);
        min-height: 100vh;
        border-radius: 12px;
        overflow: hidden;
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
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 2px solid var(--ink);
        background: var(--card);
      }
      .brand { display: flex; align-items: center; gap: 10px; }
      .brand-title {
        font-family: 'Space Grotesk', 'IBM Plex Sans', sans-serif;
        font-weight: 700;
        font-size: 17px;
        letter-spacing: 0.01em;
        line-height: 1.1;
      }
      .brand-sub { font-size: 12px; color: var(--ink-soft); margin-top: 2px; }
      .top-actions { display: flex; align-items: center; gap: 8px; }

      .save-indicator {
        font-size: 12px;
        color: var(--ink-soft);
        display: flex;
        align-items: center;
        gap: 5px;
        margin-right: 4px;
      }
      .save-ok { color: var(--teal); }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 13.5px;
        font-weight: 600;
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
      .btn-primary { background: var(--rust); border-color: var(--rust); color: #fff; }
      .btn-primary:hover { background: #a83a0c; }
      .btn-sm { padding: 6px 10px; font-size: 12.5px; }

      .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px; height: 30px;
        border-radius: 7px;
        border: 1.5px solid var(--line);
        background: transparent;
        color: var(--ink-soft);
        cursor: pointer;
      }
      .icon-btn:hover { border-color: var(--ink); color: var(--ink); }
      .icon-btn-danger:hover { border-color: var(--rust); color: var(--rust); }

      .body-grid {
        display: flex;
        flex: 1;
        min-height: 560px;
      }

      .roster-rail {
        width: 220px;
        flex-shrink: 0;
        border-right: 2px solid var(--ink);
        padding: 16px 12px;
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
        border-radius: 8px;
        border: none;
        background: transparent;
        color: var(--ink);
        font-size: 13.5px;
        text-align: left;
        cursor: pointer;
        margin-bottom: 2px;
      }
      .roster-item:hover { background: var(--rust-soft); }
      .roster-item-active { background: var(--rust); color: #fff; font-weight: 600; }
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

      .main-panel { flex: 1; padding: 18px 24px 32px; overflow-y: auto; }
      .tab-row { display: flex; gap: 6px; margin-bottom: 18px; border-bottom: 1.5px solid var(--line); }
      .tab-btn {
        display: flex; align-items: center; gap: 6px;
        padding: 9px 4px 11px;
        margin-right: 18px;
        border: none; background: none;
        font-size: 13.5px; font-weight: 600;
        color: var(--ink-soft);
        border-bottom: 2.5px solid transparent;
        cursor: pointer;
        margin-bottom: -1.5px;
      }
      .tab-btn-active { color: var(--ink); border-color: var(--rust); }

      .empty-state {
        display: flex; flex-direction: column; align-items: center; gap: 10px;
        padding: 60px 0; color: var(--ink-soft);
      }

      .tab-content { display: flex; flex-direction: column; gap: 18px; }

      .quota-strip { display: flex; flex-wrap: wrap; gap: 8px; }
      .quota-chip {
        background: var(--card);
        border: 1.5px solid var(--line);
        border-radius: 9px;
        padding: 7px 12px;
        display: flex; flex-direction: column; gap: 2px;
        min-width: 84px;
      }
      .quota-cat { font-size: 11px; color: var(--ink-soft); }
      .quota-num { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 15px; }
      .quota-of { font-size: 11px; color: var(--ink-soft); font-weight: 400; }

      .card {
        background: var(--card);
        border: 1.5px solid var(--line);
        border-radius: 12px;
        padding: 16px 18px 18px;
      }
      .card-head {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 12px;
      }
      .card-head h2 {
        font-family: 'Space Grotesk', sans-serif;
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
      .badge-good { background: var(--teal-soft); color: var(--teal); }

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
      .mission-check { background: none; border: none; color: var(--rust); cursor: pointer; padding: 0; margin-top: 1px; }
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
      .text-input:focus { outline: none; border-color: var(--rust); }
      .text-input-sm { padding: 6px 9px; font-size: 12.5px; }
      .text-input-num { max-width: 76px; flex: none; font-family: 'IBM Plex Mono', monospace; }
      .select-input { flex: none; min-width: 150px; }

      .gear-list { list-style: none; margin: 0 0 10px; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      .gear-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 9px 10px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fff;
      }
      .gear-text { display: flex; flex-direction: column; gap: 1px; }
      .gear-primary { font-weight: 600; font-size: 13.5px; }
      .gear-secondary { font-size: 12px; color: var(--ink-soft); }
      .gear-notes { font-size: 11.5px; color: var(--ink-soft); font-style: italic; }

      .link-add {
        display: inline-flex; align-items: center; gap: 6px;
        background: none; border: none; color: var(--rust);
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
      .mission-note-input:focus { outline: none; border-color: var(--rust); color: var(--ink); }

      .generator-card { border-color: var(--rust); border-width: 2px; }
      .gen-inputs { display: flex; gap: 14px; flex-wrap: wrap; margin: 10px 0 16px; }
      .gen-field { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--ink-soft); flex: 1; min-width: 160px; }
      .split-head {
        display: flex; align-items: center; justify-content: space-between;
        font-size: 11px; color: var(--ink-soft); margin-bottom: 6px;
      }
      .split-total { display: flex; align-items: center; gap: 6px; font-weight: 600; }
      .split-ok { color: var(--teal); }
      .split-warn { color: var(--rust); }
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
        background: var(--card, #FBFAF6);
        border-radius: 14px;
        width: 100%; max-width: 380px;
        padding: 18px 20px 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      }
      .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
      .modal-head h3 { margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 16px; }
      .modal-body { display: flex; flex-direction: column; gap: 10px; }
      .error-text { display: flex; align-items: center; gap: 5px; color: #B3261E; font-size: 12.5px; }

      .identity-list { display: flex; flex-direction: column; gap: 4px; margin: 6px 0 12px; }
      .identity-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 12px; border-radius: 8px;
        border: 1.5px solid var(--line, #D9D3C2);
        background: #fff; font-size: 13.5px; font-weight: 500;
        cursor: pointer;
      }
      .identity-row:hover { border-color: var(--rust, #C1440E); }
      .identity-new { display: flex; gap: 8px; }

      @media (max-width: 720px) {
        .body-grid { flex-direction: column; }
        .roster-rail { width: 100%; border-right: none; border-bottom: 2px solid var(--ink); }
        .roster-rail nav { display: flex; overflow-x: auto; gap: 6px; }
        .roster-item { width: auto; white-space: nowrap; }
        .rail-add, .rail-add-form { display: none; }
        .main-panel { padding: 16px; }
        .quota-table-head, .quota-table-row { grid-template-columns: 1fr 60px 60px; gap: 6px; }
      }
    `}</style>
  );
}
