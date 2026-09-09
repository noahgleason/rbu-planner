import React from "react";
import ReactDOM from "react-dom/client";
import MissionPortal from "./MissionPortal.jsx";
import SiteApp from "./site/SiteApp.jsx";

// /site/* is a separate, unrelated app tree (landing page + branch-manager
// onboarding proof of concept) — everything else still boots the planner
// exactly as before.
const isSite = window.location.pathname.startsWith("/site");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isSite ? <SiteApp /> : <MissionPortal />}
  </React.StrictMode>
);
