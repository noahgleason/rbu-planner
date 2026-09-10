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
        --success: #12873F;
        --navy: #001C39;
        --card: #FFFFFF;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: var(--paper);
        color: var(--ink);
        min-height: 100vh;
        -webkit-font-smoothing: antialiased;
      }
      .site-root * { box-sizing: border-box; }
      .site-root a { color: inherit; text-decoration: none; }
      .site-root h1, .site-root h2, .site-root h3 { letter-spacing: -0.02em; }

      /* ---- header ---- */
      .site-header {
        position: sticky; top: 0; z-index: 10;
        display: flex; align-items: center; justify-content: space-between; gap: 16px;
        padding: 14px 32px; border-bottom: 1px solid var(--line);
        background: rgba(255,255,255,0.86); backdrop-filter: blur(10px);
      }
      .site-brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; }
      .site-nav-links { display: flex; gap: 22px; font-size: 13.5px; font-weight: 500; color: var(--ink-soft); }
      .site-nav-links a:hover { color: var(--ink); }
      .site-nav-actions { display: flex; align-items: center; gap: 10px; }

      /* ---- buttons / badges ---- */
      .site-btn {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 9px 16px; border-radius: 999px; font-size: 13.5px; font-weight: 600;
        border: 1.5px solid transparent; cursor: pointer; background: none; white-space: nowrap;
        transition: transform .12s ease, background .12s ease, border-color .12s ease;
      }
      .site-btn:active { transform: translateY(1px); }
      .site-root .site-btn-primary { background: var(--navy); color: #fff; }
      .site-root .site-btn-primary:hover { background: #00284d; }
      .site-root .site-btn-outline { border-color: var(--line); color: var(--ink); background: var(--card); }
      .site-root .site-btn-outline:hover { border-color: var(--ink); }
      .site-btn-lg { padding: 13px 22px; font-size: 14.5px; }
      .site-btn[disabled] { opacity: .5; cursor: not-allowed; }
      .site-badge {
        display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px;
        border-radius: 999px; font-size: 11.5px; font-weight: 700; background: var(--accent-soft); color: var(--accent);
        letter-spacing: .01em;
      }

      /* ---- hero ---- */
      .site-hero {
        position: relative; overflow: hidden;
        display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 48px; align-items: center;
        max-width: 1120px; margin: 0 auto; padding: 72px 32px 64px;
      }
      .site-hero::before {
        content: ""; position: absolute; inset: -40% -20% auto auto; width: 70%; height: 140%;
        background: radial-gradient(closest-side, rgba(27,106,238,0.16), rgba(27,106,238,0) 70%);
        pointer-events: none; z-index: 0;
      }
      .site-hero > * { position: relative; z-index: 1; }
      .site-hero-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 18px; }
      .site-hero h1 { font-size: 46px; line-height: 1.08; margin: 0; max-width: 12ch; }
      .site-hero p { font-size: 16.5px; line-height: 1.55; color: var(--ink-soft); margin: 0; max-width: 520px; }
      .site-hero-actions { display: flex; gap: 12px; margin-top: 4px; flex-wrap: wrap; }
      .site-hero-proof {
        list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px 18px;
        font-size: 12.5px; color: var(--ink-soft); font-weight: 500;
      }
      .site-hero-proof li { display: flex; align-items: center; gap: 6px; }
      .site-hero-proof svg { color: var(--accent); }
      .site-hero-media { position: relative; }
      .site-hero-img { width: 100%; border-radius: 18px; box-shadow: 0 30px 80px rgba(0,15,30,0.18); display: block; }

      /* ---- product mock (browser window) ---- */
      .site-mock-window {
        position: relative; background: var(--card); border-radius: 16px;
        border: 1px solid var(--line); box-shadow: 0 30px 80px rgba(0,15,30,0.16), 0 2px 6px rgba(0,15,30,0.06);
        font-size: 12px; overflow: visible;
      }
      .site-mock-chrome {
        display: flex; align-items: center; gap: 6px; padding: 10px 12px;
        border-bottom: 1px solid var(--line); background: #FBFBFC; border-radius: 16px 16px 0 0;
      }
      .site-mock-chrome > span { width: 9px; height: 9px; border-radius: 50%; background: rgba(0,15,30,0.14); }
      .site-mock-url {
        margin-left: 8px; flex: 1; padding: 5px 10px; border-radius: 7px;
        background: var(--paper); color: var(--ink-soft); font-size: 11px; font-weight: 500;
      }
      .site-mock-body { padding: 14px 14px 16px; }
      .site-mock-topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
      .site-mock-topbar strong { display: block; font-size: 13px; }
      .site-mock-topbar span:not(.site-mock-pill) { font-size: 11px; color: var(--ink-soft); }
      .site-mock-pill {
        padding: 3px 9px; border-radius: 999px; font-size: 10.5px; font-weight: 700;
        background: var(--paper); color: var(--ink-soft);
      }
      .site-mock-pill-ok { background: #E8F5ED; color: var(--success); }
      .site-mock-chips { display: flex; gap: 8px; margin-bottom: 12px; }
      .site-mock-chip {
        flex: 1; background: var(--paper); border-radius: 9px; padding: 7px 9px;
        display: flex; flex-direction: column; gap: 2px;
      }
      .site-mock-chip span { font-size: 10px; color: var(--ink-soft); font-weight: 500; }
      .site-mock-chip b { font-size: 13px; }
      .site-mock-chip i { font-style: normal; font-weight: 500; color: var(--ink-soft); font-size: 11px; }
      .site-mock-table { display: flex; flex-direction: column; }
      .site-mock-row {
        display: grid; grid-template-columns: 74px 96px 1fr 48px 18px; gap: 8px; align-items: center;
        padding: 7px 4px; border-bottom: 1px solid var(--line); white-space: nowrap; overflow: hidden;
      }
      .site-mock-row > span { overflow: hidden; text-overflow: ellipsis; }
      .site-mock-row-head { font-size: 10px; color: var(--ink-soft); font-weight: 600; padding-top: 0; }
      .site-mock-row:last-child { border-bottom: none; }
      .site-mock-row-draft { box-shadow: inset 3px 0 0 rgba(27,106,238,0.45); }
      .site-mock-row-draft .site-mock-directive { color: var(--ink-soft); }
      .site-mock-date { color: var(--ink-soft); }
      .site-mock-status { color: var(--accent); display: flex; }
      .site-mock-float {
        position: absolute; right: -18px; bottom: -22px; width: 230px;
        background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px;
        box-shadow: 0 18px 44px rgba(0,15,30,0.18);
      }
      .site-mock-float-title { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 12px; margin-bottom: 4px; }
      .site-mock-float-title svg { color: var(--accent); }
      .site-mock-float p { margin: 0 0 8px; font-size: 11.5px; color: var(--ink-soft); line-height: 1.4; }
      .site-mock-float-btn {
        display: inline-block; padding: 6px 12px; border-radius: 999px; background: var(--accent); color: #fff;
        font-size: 11px; font-weight: 700;
      }

      /* ---- SM-view mock (card) ---- */
      .site-mock-card {
        background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 16px 16px 8px;
        box-shadow: 0 24px 60px rgba(0,15,30,0.14); max-width: 420px; margin: 0 auto; font-size: 13px;
      }
      .site-mock-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .site-mock-mission { display: flex; gap: 12px; padding: 12px 2px; border-bottom: 1px solid var(--line); color: var(--accent); }
      .site-mock-mission:last-child { border-bottom: none; }
      .site-mock-mission > div { display: flex; flex-direction: column; gap: 3px; color: var(--ink); min-width: 0; }
      .site-mock-mission b { font-size: 13.5px; }
      .site-mock-mission em { font-size: 12px; color: var(--ink-soft); }
      .site-mock-mission span { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--ink-soft); }
      .site-mock-mission-done b, .site-mock-mission-done em { text-decoration: line-through; opacity: .6; }
      .site-mock-tbd { border-bottom: 1.5px dashed var(--line); width: fit-content; }

      /* ---- sections ---- */
      .site-section { max-width: 1120px; margin: 0 auto; padding: 64px 32px; }
      .site-section h2 { font-size: 30px; margin: 0 0 10px; text-align: center; }
      .site-section-sub { text-align: center; color: var(--ink-soft); font-size: 15px; margin: 0 auto 40px; max-width: 560px; }

      .site-steps {
        list-style: none; margin: 0; padding: 0;
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px;
      }
      .site-steps li {
        background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 22px 20px;
        display: flex; flex-direction: column; gap: 8px;
      }
      .site-step-num {
        width: 30px; height: 30px; border-radius: 50%; background: var(--navy); color: #fff;
        display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; margin-bottom: 4px;
      }
      .site-steps h3 { margin: 0; font-size: 15.5px; }
      .site-steps p { margin: 0; font-size: 13.5px; color: var(--ink-soft); line-height: 1.55; }

      .site-section-split {
        display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: 56px; align-items: center;
      }
      .site-split-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
      .site-split-copy h2 { text-align: left; font-size: 30px; margin: 0; }
      .site-split-text { font-size: 15.5px; line-height: 1.6; color: var(--ink-soft); margin: 0 0 8px; }

      .site-feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; width: 100%; }
      .site-feature-grid-2 { grid-template-columns: repeat(2, 1fr); }
      .site-feature-card {
        background: var(--card); border: 1px solid var(--line); border-radius: 14px;
        padding: 20px; display: flex; flex-direction: column; gap: 10px;
      }
      .site-feature-icon {
        width: 36px; height: 36px; border-radius: 10px; background: var(--accent-soft);
        color: var(--accent); display: flex; align-items: center; justify-content: center;
      }
      .site-feature-card h3 { margin: 0; font-size: 15px; }
      .site-feature-card p { margin: 0; font-size: 13.5px; color: var(--ink-soft); line-height: 1.5; }

      .site-cta {
        max-width: 1120px; margin: 16px auto 0; padding: 56px 32px; text-align: center;
        background: var(--navy); color: #fff; border-radius: 24px;
        display: flex; flex-direction: column; align-items: center; gap: 10px;
      }
      .site-cta h2 { margin: 0; font-size: 30px; }
      .site-cta p { margin: 0 0 12px; color: rgba(255,255,255,0.72); font-size: 15px; }
      .site-cta .site-btn-primary { background: var(--accent); }
      .site-cta .site-btn-primary:hover { background: #1558c9; }
      .site-cta .site-btn-outline { background: transparent; color: #fff; border-color: rgba(255,255,255,0.35); }
      .site-cta .site-btn-outline:hover { border-color: #fff; }

      .site-footer {
        max-width: 1120px; margin: 0 auto; padding: 36px 32px 44px; text-align: center;
        color: var(--ink-soft); font-size: 12.5px; display: flex; flex-direction: column; gap: 14px; align-items: center;
      }
      .site-footer-links { display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; font-weight: 500; }
      .site-footer-links a:hover { color: var(--ink); }

      /* ---- simple card pages (login stubs, branch setup) ---- */
      .site-card-page {
        max-width: 480px; margin: 60px auto; background: var(--card);
        border: 1px solid var(--line); border-radius: 16px; padding: 32px;
        box-shadow: 0 16px 48px rgba(0,15,30,0.08);
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
      .site-summary-list { list-style: none; margin: 0 0 20px; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      .site-summary-list li {
        display: flex; justify-content: space-between; padding: 10px 12px;
        border: 1px solid var(--line); border-radius: 10px; font-size: 13.5px;
      }
      .site-poc-note {
        background: var(--accent-soft); border-radius: 10px; padding: 10px 14px;
        font-size: 12.5px; color: var(--navy); margin-bottom: 18px;
      }

      @media (max-width: 900px) {
        .site-hero { grid-template-columns: 1fr; padding: 48px 20px 40px; gap: 36px; }
        .site-hero h1 { font-size: 34px; max-width: none; }
        .site-hero-media { padding-bottom: 28px; padding-right: 8px; }
        .site-mock-float { right: 0; bottom: -14px; }
        .site-steps { grid-template-columns: repeat(2, 1fr); }
        .site-section-split { grid-template-columns: 1fr; gap: 32px; }
        .site-nav-links { display: none; }
      }
      @media (max-width: 600px) {
        .site-header { padding: 12px 16px; }
        .site-nav-actions .site-btn { padding: 8px 12px; font-size: 12.5px; }
        .site-steps, .site-feature-grid, .site-feature-grid-2 { grid-template-columns: 1fr; }
        .site-section { padding: 44px 20px; }
        .site-section h2, .site-split-copy h2, .site-cta h2 { font-size: 24px; }
        .site-cta { margin: 0 12px; border-radius: 18px; padding: 40px 20px; }
        .site-mock-row { grid-template-columns: 64px 80px 1fr 40px 16px; }
      }
    `}</style>
  );
}
