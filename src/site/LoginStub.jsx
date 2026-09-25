import React from "react";
import { Lock, ArrowRight, Building2, Plus } from "lucide-react";

// Same key BranchSetup saves to — lets the FMS sign-in offer "open your
// branch" once one exists on this device.
const BRANCH_KEY = "site-branch-setup";

function loadBranch() {
  try {
    const raw = window.localStorage.getItem(BRANCH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// No real auth yet — proof of concept. "Continue" just moves on to where
// that role would land once sign-in exists: an SM straight to their
// branch's planner, an FMS to their branch (admin prompt up front) or to
// setting up a new one.
export default function LoginStub({ role, nextHref, isFms = false }) {
  const branch = isFms ? loadBranch() : null;
  return (
    <div className="site-card-page">
      <div className="site-feature-icon" style={{ marginBottom: 14 }}><Lock size={18} /></div>
      <h1>{role} sign-in</h1>
      <p className="site-muted">
        {isFms
          ? "Coming soon — accounts aren't wired up yet. For now, open your branch or set up a new one."
          : "Coming soon — accounts aren't wired up yet. For now, continue straight to your branch's plan."}
      </p>
      <div className="site-poc-note">Proof of concept: this screen is a placeholder, not a real login.</div>
      {isFms ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
          <a className="site-btn site-btn-primary" href="/plan?admin=1">
            <Building2 size={14} /> {branch?.branchName ? `Open ${branch.branchName}` : "Open my branch"} <ArrowRight size={14} />
          </a>
          <a className="site-btn site-btn-outline" href="/site/branch-setup?new=1">
            <Plus size={14} /> Set up a new branch
          </a>
        </div>
      ) : (
        <a className="site-btn site-btn-primary" href={nextHref}>
          Continue <ArrowRight size={14} />
        </a>
      )}
      <div style={{ marginTop: 14 }}>
        <a className="site-btn site-btn-outline" href="/site">Back to home</a>
      </div>
    </div>
  );
}
