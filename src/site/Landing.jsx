import React from "react";
import BrandMark from "../BrandMark.jsx";
import {
  LayoutGrid, Users2, ClipboardCheck, CheckCircle2, Circle, ArrowRight,
  Sparkles, CalendarDays, MapPin, ShieldCheck,
} from "lucide-react";

// Real photography goes here when you have assets you're cleared to use
// (e.g. brand imagery from your SM kit): drop the file in public/site/ and
// set HERO_IMAGE = "/site/hero.jpg". Until then the hero shows a built
// product mock instead of a stock-photo placeholder.
const HERO_IMAGE = null;

// Names in the mocks are fictional on purpose — this page is public.
const MOCK_ROWS = [
  { person: "Avery R.", occasion: "Party & Socialize", directive: "ArtPrize opening ceremony", date: "Sep 18", status: "done" },
  { person: "Jordan K.", occasion: "Work", directive: "Haworth Center at-work sampling", date: "Sep 16", status: "edited" },
  { person: "Priya S.", occasion: "Study", directive: "GVSU library — 2×", date: "", status: "draft" },
  { person: "Marcus T.", occasion: "Gaming", directive: "Sonic signing event", date: "Sep 26", status: "edited" },
  { person: "Sam L.", occasion: "Fitness", directive: "New-user gyms", date: "", status: "draft" },
];

function PlanMock() {
  return (
    <div className="site-mock-window" aria-hidden="true">
      <div className="site-mock-chrome">
        <span /><span /><span />
        <div className="site-mock-url">missionmanifest / lansing / plan</div>
      </div>
      <div className="site-mock-body">
        <div className="site-mock-topbar">
          <div>
            <strong>September — Lansing</strong>
            <span>Missions due 9/2</span>
          </div>
          <span className="site-mock-pill site-mock-pill-ok">Saved</span>
        </div>
        <div className="site-mock-chips">
          {[["Study", "2", "11"], ["Work", "1", "6"], ["P&S", "0", "7"], ["Gaming", "1", "4"]].map(([o, r, p]) => (
            <div className="site-mock-chip" key={o}>
              <span>{o}</span>
              <b>{r}<i>/{p}</i></b>
            </div>
          ))}
        </div>
        <div className="site-mock-table">
          <div className="site-mock-row site-mock-row-head">
            <span>Person</span><span>Occasion</span><span>Directive</span><span>Date</span><span />
          </div>
          {MOCK_ROWS.map((r) => (
            <div className={`site-mock-row ${r.status === "draft" ? "site-mock-row-draft" : ""}`} key={r.person}>
              <span>{r.person}</span>
              <span>{r.occasion}</span>
              <span className="site-mock-directive">{r.directive || "—"}</span>
              <span className="site-mock-date">{r.date || "—"}</span>
              <span className="site-mock-status">
                {r.status === "done" ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="site-mock-float">
        <div className="site-mock-float-title"><Sparkles size={13} /> Generate plan</div>
        <p>Replace <b>12</b> untouched drafts · keep <b>21</b> you've edited</p>
        <span className="site-mock-float-btn">Apply</span>
      </div>
    </div>
  );
}

function SmMock() {
  const rows = [
    { occasion: "Study", directive: "GVSU library — 2×", location: "Mary Idema Pew Library", done: true },
    { occasion: "Party & Socialize", directive: "ArtPrize opening ceremony", location: "Rosa Parks Circle", done: false },
    { occasion: "Fitness", directive: "New-user gyms", location: "", done: false },
  ];
  return (
    <div className="site-mock-card" aria-hidden="true">
      <div className="site-mock-card-head">
        <strong>Priya's missions</strong>
        <span className="site-mock-pill">1 of 3 complete</span>
      </div>
      {rows.map((r) => (
        <div className={`site-mock-mission ${r.done ? "site-mock-mission-done" : ""}`} key={r.occasion}>
          {r.done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
          <div>
            <b>{r.occasion}</b>
            <em>{r.directive}</em>
            <span className={r.location ? "" : "site-mock-tbd"}>
              <MapPin size={11} /> {r.location || "No location suggested yet"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Landing() {
  return (
    <>
      <header className="site-header">
        <a className="site-brand" href="/site"><BrandMark height={28} /> Mission Manifest</a>
        <nav className="site-nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#for-teams">For teams</a>
        </nav>
        <div className="site-nav-actions">
          <a className="site-btn site-btn-outline" href="/site/login/sm">SM Login</a>
          <a className="site-btn site-btn-primary" href="/site/login/manager">FMS Login</a>
        </div>
      </header>

      <section className="site-hero">
        <div className="site-hero-copy">
          <span className="site-badge">Multi-branch preview</span>
          <h1>The monthly plan, without the spreadsheet.</h1>
          <p>
            Mission Manifest turns a Field Marketing Specialist's (FMS) monthly product allotment into a shared, self-service
            planning guide — generated as a draft, hand-tuned with real directives, and shared with every team you oversee.
            Results still live in RBU; this is where the plan comes together.
          </p>
          <div className="site-hero-actions">
            <a className="site-btn site-btn-primary site-btn-lg" href="/site/login/sm">
              SM Login <ArrowRight size={15} />
            </a>
            <a className="site-btn site-btn-outline site-btn-lg" href="/site/branch-setup">FMS? Set up your branch</a>
          </div>
          <ul className="site-hero-proof">
            <li><ShieldCheck size={14} /> Password-protected admin, shared storage</li>
            <li><CalendarDays size={14} /> Deadline-aware</li>
            <li><Users2 size={14} /> One FMS, many teams</li>
          </ul>
        </div>
        <div className="site-hero-media">
          {HERO_IMAGE ? <img className="site-hero-img" src={HERO_IMAGE} alt="" /> : <PlanMock />}
        </div>
      </section>

      <section className="site-section" id="how-it-works">
        <h2>From allotment to field in four steps</h2>
        <p className="site-section-sub">The same monthly cycle your planning sheet runs — just without rebuilding it by hand.</p>
        <ol className="site-steps">
          <li>
            <span className="site-step-num">1</span>
            <h3>Enter the allotment</h3>
            <p>Cans → cases → missions, with the occasion split you already plan against. The math is done for you.</p>
          </li>
          <li>
            <span className="site-step-num">2</span>
            <h3>Generate a draft</h3>
            <p>Missions are distributed across the roster by priority. It's a starting point, not the answer.</p>
          </li>
          <li>
            <span className="site-step-num">3</span>
            <h3>Hand-tune with intent</h3>
            <p>Add the directive, partner, and date per mission. Re-generating never overwrites anything you've touched.</p>
          </li>
          <li>
            <span className="site-step-num">4</span>
            <h3>The team runs it</h3>
            <p>Each marketeer sees only their missions — with any location the FMS suggested — and checks them off as they go.</p>
          </li>
        </ol>
      </section>

      <section className="site-section site-section-split" id="for-teams">
        <div className="site-split-copy">
          <span className="site-badge">For student marketeers</span>
          <h2>Everyone sees their part — and only their part.</h2>
          <p className="site-split-text">
            No hunting through a shared sheet. Your missions, the FMS's directive for each one, your partner,
            your date, and any location they've suggested. Gear, placements, and volunteer sign-ups live right next to it.
          </p>
          <div className="site-feature-grid site-feature-grid-2">
            <div className="site-feature-card">
              <div className="site-feature-icon"><LayoutGrid size={18} /></div>
              <h3>One branch, many teams</h3>
              <p>An FMS isn't tied to a single roster — every team they oversee, each with its own plan and can goal.</p>
            </div>
            <div className="site-feature-card">
              <div className="site-feature-icon"><ClipboardCheck size={18} /></div>
              <h3>Draft, then hand-tune</h3>
              <p>Generate from the allotment, then edit every mission inline in a dense, filterable table.</p>
            </div>
          </div>
        </div>
        <div className="site-split-media">
          <SmMock />
        </div>
      </section>

      <section className="site-cta">
        <h2>Set up your branch in about a minute.</h2>
        <p>Name it, add the teams you manage, and start planning this month.</p>
        <div className="site-hero-actions">
          <a className="site-btn site-btn-primary site-btn-lg" href="/site/branch-setup">Set up your branch <ArrowRight size={15} /></a>
          <a className="site-btn site-btn-outline site-btn-lg" href="/plan">Open the planner</a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer-links">
          <a href="/site/branch-setup">Branch setup</a>
          <a href="/site/login/manager">FMS Login</a>
          <a href="/site/login/sm">SM Login</a>
          <a href="/plan">Planner</a>
        </div>
        <span>Mission Manifest — an independent field-marketing planning tool. Not affiliated with or endorsed by any brand.</span>
      </footer>
    </>
  );
}
