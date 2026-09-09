import React from "react";

// Self-contained styles for the /site section — every rule is scoped under
// .site-root and every classname is prefixed `site-` so this can never
// collide with PortalStyles in MissionPortal.jsx, even though both ship in
// the same bundle. Reuses the main app's color palette for brand
// consistency, but is otherwise fully independent.
export default function SiteStyles() {
  return (
    <style>{`
      .site-root {
        --paper: #F8F8F8;
        --ink: #000F1E;
        --ink-soft: rgba(0,15,30,0.62);
        --line: rgba(0,15,30,0.12);
        --accent: #1B6AEE;
        --accent-soft: #E5EEFD;
        --navy: #001C39;
        --card: #FFFFFF;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: var(--paper);
        color: var(--ink);
        min-height: 100vh;
      }
      .site-root * { box-sizing: border-box; }
      .site-root a { color: inherit; text-decoration: none; }

      .site-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 18px 32px; border-bottom: 1px solid var(--line);
        background: var(--card);
      }
      .site-brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; }
      .site-nav-actions { display: flex; align-items: center; gap: 10px; }

      .site-btn {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 9px 16px; border-radius: 999px; font-size: 13.5px; font-weight: 600;
        border: 1.5px solid transparent; cursor: pointer; background: none;
      }
      .site-btn-primary { background: var(--navy); color: #fff; }
      .site-btn-primary:hover { background: #00284d; }
      .site-btn-outline { border-color: var(--line); color: var(--ink); }
      .site-btn-outline:hover { border-color: var(--ink); }
      .site-btn-lg { padding: 13px 24px; font-size: 14.5px; }

      .site-hero {
        display: flex; flex-direction: column; align-items: center; text-align: center;
        gap: 20px; padding: 72px 24px 56px; max-width: 780px; margin: 0 auto;
      }
      .site-hero h1 { font-size: 38px; line-height: 1.15; margin: 0; letter-spacing: -0.02em; }
      .site-hero p { font-size: 16px; color: var(--ink-soft); margin: 0; max-width: 560px; }
      .site-hero-actions { display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap; justify-content: center; }

      .site-img-placeholder {
        width: 100%; border-radius: 16px; background: var(--accent-soft);
        border: 1.5px dashed var(--accent);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 6px; color: var(--accent); font-size: 13px; font-weight: 600;
        min-height: 260px;
      }
      .site-img-placeholder svg { opacity: 0.6; }
      .site-hero-image { max-width: 900px; margin: 0 auto 8px; }

      .site-section { max-width: 980px; margin: 0 auto; padding: 48px 24px; }
      .site-section h2 { font-size: 24px; margin: 0 0 8px; text-align: center; }
      .site-section-sub { text-align: center; color: var(--ink-soft); font-size: 14.5px; margin: 0 0 32px; }

      .site-feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
      .site-feature-card {
        background: var(--card); border: 1px solid var(--line); border-radius: 14px;
        padding: 22px; display: flex; flex-direction: column; gap: 10px;
      }
      .site-feature-card .site-feature-icon {
        width: 36px; height: 36px; border-radius: 10px; background: var(--accent-soft);
        color: var(--accent); display: flex; align-items: center; justify-content: center;
      }
      .site-feature-card h3 { margin: 0; font-size: 15px; }
      .site-feature-card p { margin: 0; font-size: 13.5px; color: var(--ink-soft); line-height: 1.5; }

      .site-footer {
        border-top: 1px solid var(--line); padding: 24px 32px; text-align: center;
        color: var(--ink-soft); font-size: 12.5px;
      }

      .site-card-page {
        max-width: 480px; margin: 60px auto; background: var(--card);
        border: 1px solid var(--line); border-radius: 16px; padding: 32px;
      }
      .site-card-page h1 { font-size: 20px; margin: 0 0 6px; }
      .site-card-page .site-muted { color: var(--ink-soft); font-size: 13.5px; margin: 0 0 20px; }

      .site-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; font-size: 13px; }
      .site-field span { font-weight: 600; color: var(--ink-soft); font-size: 12px; }
      .site-input {
        padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--line);
        font-size: 14px; font-family: inherit; background: var(--paper); color: var(--ink);
      }
      .site-input:focus { outline: none; border-color: var(--accent); }

      .site-team-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
      .site-badge {
        display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px;
        border-radius: 999px; font-size: 11.5px; font-weight: 700; background: var(--accent-soft); color: var(--accent);
      }
      .site-summary-list { list-style: none; margin: 0 0 20px; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      .site-summary-list li {
        display: flex; justify-content: space-between; padding: 10px 12px;
        border: 1px solid var(--line); border-radius: 10px; font-size: 13.5px;
      }
      .site-poc-note {
        background: var(--accent-soft); border-radius: 10px; padding: 10px 14px;
        font-size: 12.5px; color: var(--navy); margin-bottom: 18px;
      }

      @media (max-width: 720px) {
        .site-feature-grid { grid-template-columns: 1fr; }
        .site-hero h1 { font-size: 28px; }
        .site-header { padding: 14px 18px; }
      }
    `}</style>
  );
}
