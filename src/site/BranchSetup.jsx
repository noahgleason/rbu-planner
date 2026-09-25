import React, { useState } from "react";
import { Building2, Plus, CheckCircle2 } from "lucide-react";

// Proof-of-concept persistence only: plain localStorage, a key of its own,
// completely separate from the planner's shared storage (src/storage.js)
// and v5 schema. Nothing here is wired to the real teams/roster data yet —
// that integration is future work once real FMS auth exists.
const STORAGE_KEY = "site-branch-setup";

function loadSaved() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function slug(name) {
  return (name || "branch").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "branch";
}

export default function BranchSetup() {
  // ?new=1 (from "Set up a new branch" on FMS sign-in) starts a blank form
  // instead of showing the branch already saved on this device.
  const isNew = new URLSearchParams(window.location.search).get("new") === "1";
  const initial = isNew ? null : loadSaved();
  const [managerName, setManagerName] = useState(initial?.managerName || "");
  const [branchName, setBranchName] = useState(initial?.branchName || "");
  const [teamNames, setTeamNames] = useState(initial?.teams?.length ? initial.teams : ["", ""]);
  const [isSaved, setIsSaved] = useState(!!initial);
  const [result, setResult] = useState(initial);

  function setCount(n) {
    const count = Math.max(1, Math.min(12, n || 1));
    setTeamNames((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push("");
      return next;
    });
  }

  function submit() {
    const branch = {
      id: `${slug(branchName)}-${Date.now().toString(36)}`,
      managerName: managerName.trim(),
      branchName: branchName.trim(),
      teams: teamNames.map((n) => n.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(branch));
    setResult(branch);
    setIsSaved(true);
  }

  const canSubmit = managerName.trim() && branchName.trim() && teamNames.some((n) => n.trim());

  if (isSaved && result) {
    return (
      <div className="site-card-page">
        <div className="site-feature-icon" style={{ marginBottom: 14 }}><CheckCircle2 size={18} /></div>
        <h1>{result.branchName} is set up</h1>
        <p className="site-muted">Managed by {result.managerName}.</p>
        <div className="site-poc-note">
          Proof of concept — saved to this browser only, not yet connected to the real team plans in the main app.
        </div>
        <ul className="site-summary-list">
          {result.teams.map((t) => (
            <li key={t}><span>{t}</span><span className="site-badge">Team</span></li>
          ))}
        </ul>
        <button className="site-btn site-btn-outline" onClick={() => setIsSaved(false)}>Edit setup</button>
        <div style={{ marginTop: 10 }}>
          <a className="site-btn site-btn-primary" href="/plan?admin=1">Go to the planner</a>
        </div>
      </div>
    );
  }

  return (
    <div className="site-card-page" style={{ maxWidth: 560 }}>
      <div className="site-feature-icon" style={{ marginBottom: 14 }}><Building2 size={18} /></div>
      <h1>Set up your branch</h1>
      <p className="site-muted">Every FMS (Field Marketing Specialist) sets up their own branch — an FMS isn't tied to just one team.</p>
      <div className="site-poc-note">Proof of concept — no login yet, and this doesn't touch your real planner data.</div>

      <label className="site-field">
        <span>Your name</span>
        <input className="site-input" placeholder="e.g. Hunter" value={managerName} onChange={(e) => setManagerName(e.target.value)} />
      </label>
      <label className="site-field">
        <span>Branch name</span>
        <input className="site-input" placeholder="e.g. West Michigan" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
      </label>
      <label className="site-field">
        <span>How many teams do you manage?</span>
        <input
          className="site-input"
          type="number" min="1" max="12"
          value={teamNames.length}
          onChange={(e) => setCount(parseInt(e.target.value || "1", 10))}
        />
      </label>

      <div className="site-team-list">
        {teamNames.map((name, i) => (
          <label className="site-field" key={i} style={{ marginBottom: 0 }}>
            <span>Team {i + 1} name</span>
            <input
              className="site-input"
              placeholder={i === 0 ? "e.g. Lansing" : "e.g. Grand Rapids"}
              value={name}
              onChange={(e) => setTeamNames((prev) => prev.map((n, idx) => (idx === i ? e.target.value : n)))}
            />
          </label>
        ))}
      </div>

      <button className="site-btn site-btn-primary" disabled={!canSubmit} onClick={submit}>
        <Plus size={14} /> Create branch
      </button>
    </div>
  );
}
