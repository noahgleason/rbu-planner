import React from "react";
import { Lock, ArrowRight } from "lucide-react";

// No real auth yet — proof of concept. "Continue" just moves on to where
// that role would land once sign-in exists.
export default function LoginStub({ role, nextHref }) {
  return (
    <div className="site-card-page">
      <div className="site-feature-icon" style={{ marginBottom: 14 }}><Lock size={18} /></div>
      <h1>{role} sign-in</h1>
      <p className="site-muted">Coming soon — accounts aren't wired up yet. For now, continue without signing in.</p>
      <div className="site-poc-note">Proof of concept: this screen is a placeholder, not a real login.</div>
      <a className="site-btn site-btn-primary" href={nextHref}>
        Continue <ArrowRight size={14} />
      </a>
      <div style={{ marginTop: 14 }}>
        <a className="site-btn site-btn-outline" href="/site">Back to home</a>
      </div>
    </div>
  );
}
