import React from "react";
import { Truck, Image as ImageIcon, LayoutGrid, Users2, ClipboardCheck } from "lucide-react";

// Placeholder for a real hero/feature image later — drop in an <img
// src="/site/..."> in its place once you have assets, same spot each time.
function ImagePlaceholder({ label = "Image placeholder", minHeight }) {
  return (
    <div className="site-img-placeholder" style={minHeight ? { minHeight } : undefined}>
      <ImageIcon size={28} />
      <span>{label}</span>
    </div>
  );
}

export default function Landing() {
  return (
    <>
      <header className="site-header">
        <div className="site-brand"><Truck size={20} strokeWidth={2.2} /> Mission Manifest</div>
        <div className="site-nav-actions">
          <a className="site-btn site-btn-outline" href="/site/login/sm">SM Login</a>
          <a className="site-btn site-btn-primary" href="/site/login/manager">Branch Manager Login</a>
        </div>
      </header>

      <section className="site-hero">
        <span className="site-badge">Multi-branch preview</span>
        <h1>Run every branch's field-marketing plan from one place.</h1>
        <p>
          Mission Manifest turns a manager's monthly product allotment into a shared, self-service plan —
          missions generated, hand-tuned, and tracked, for every team a branch manager oversees.
        </p>
        <div className="site-hero-actions">
          <a className="site-btn site-btn-primary site-btn-lg" href="/site/branch-setup">Set up your branch</a>
          <a className="site-btn site-btn-outline site-btn-lg" href="#how-it-works">See how it works</a>
        </div>
      </section>

      <div className="site-hero-image">
        <ImagePlaceholder label="Hero image placeholder — e.g. a screenshot of the Plan tab" minHeight={340} />
      </div>

      <section className="site-section" id="how-it-works">
        <h2>Built around how the work actually happens</h2>
        <p className="site-section-sub">One manager, any number of teams, each with its own plan.</p>
        <div className="site-feature-grid">
          <div className="site-feature-card">
            <div className="site-feature-icon"><LayoutGrid size={18} /></div>
            <h3>One branch, many teams</h3>
            <p>A branch manager isn't tied to a single roster — set up every team you manage from one place.</p>
          </div>
          <div className="site-feature-card">
            <div className="site-feature-icon"><ClipboardCheck size={18} /></div>
            <h3>Draft, then hand-tune</h3>
            <p>Generate a starting plan from this month's allotment, then edit every mission's directive, date, and location.</p>
          </div>
          <div className="site-feature-card">
            <div className="site-feature-icon"><Users2 size={18} /></div>
            <h3>Everyone sees their part</h3>
            <p>Student marketeers see only their own missions and gear log — no spreadsheet hunting.</p>
          </div>
        </div>
      </section>

      <section className="site-section">
        <ImagePlaceholder label="Feature image placeholder — e.g. the dashboard view" minHeight={280} />
      </section>

      <footer className="site-footer">
        Mission Manifest — proof-of-concept multi-branch landing page. Not affiliated with or endorsed by any brand.
      </footer>
    </>
  );
}
