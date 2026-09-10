import React from "react";
import ReactDOM from "react-dom/client";
import MissionPortal from "./MissionPortal.jsx";
import SiteApp from "./site/SiteApp.jsx";

// The planner only boots at /plan — every other path (including bare "/")
// boots the site app, which defaults to the public landing page. This is
// the front door: opening the bare URL should always land on the landing
// page first, with sign-in/branch-setup as the path into the real planner,
// not the planner itself.
const isPlanner = /^\/plan(\/|$)/.test(window.location.pathname);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isPlanner ? <MissionPortal /> : <SiteApp />}
  </React.StrictMode>
);
