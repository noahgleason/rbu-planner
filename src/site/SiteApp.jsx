import React, { useEffect } from "react";
import Landing from "./Landing.jsx";
import BranchSetup from "./BranchSetup.jsx";
import LoginStub from "./LoginStub.jsx";
import SiteStyles from "./SiteStyles.jsx";

// A deliberately separate app tree from MissionPortal.jsx — different
// component tree, different storage (see BranchSetup's own localStorage
// key), different styles (all classNames prefixed `site-`). main.jsx boots
// this for every path except /plan (the real planner), so it's also what
// renders at the bare "/" — the site is the front door, not the planner.
// Nothing here imports from or writes to the planner's data.
//
// Plain full-navigation <a href> links between pages (no client router) —
// this is a proof of concept, not the production auth flow.
export default function SiteApp() {
  const path = window.location.pathname;
  let page;
  let title = "Mission Manifest";
  if (path.startsWith("/site/branch-setup")) {
    page = <BranchSetup />;
    title = "Set up your branch — Mission Manifest";
  } else if (path.startsWith("/site/login/manager")) {
    page = <LoginStub role="Branch Manager" nextHref="/site/branch-setup" />;
    title = "Branch Manager sign-in — Mission Manifest";
  } else if (path.startsWith("/site/login/sm")) {
    page = <LoginStub role="Student Marketeer" nextHref="/plan" />;
    title = "SM sign-in — Mission Manifest";
  } else {
    page = <Landing />;
  }

  useEffect(() => { document.title = title; }, [title]);

  return (
    <div className="site-root">
      <SiteStyles />
      {page}
    </div>
  );
}
