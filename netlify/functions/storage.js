// Netlify Function backing the app's shared (team-wide) storage.
//
// Mirrors the get/set/delete/list shape of src/storage.js so the frontend
// adapter is a thin fetch wrapper. Personal (non-shared) storage — just the
// "which roster person am I" pointer — stays in localStorage on the client;
// there's no login system to key a server-side personal store to, so only
// shared data ever reaches this function.
//
// Backed by Netlify Blobs, which requires no separate database to provision:
// it's automatically available once this site is deployed on Netlify (or
// run locally via `netlify dev`). Classic Lambda-compatible functions need
// `connectLambda(event)` called first to hydrate Blobs' context from the
// per-request `event.blobs` field — the global NETLIFY_BLOBS_CONTEXT env var
// alone isn't enough for this function style.

import { connectLambda, getStore } from "@netlify/blobs";

function store() {
  return getStore("mission-portal");
}

function namespacedKey(key) {
  return `shared:${key}`;
}

// Only "shared" data ever reaches this function (see src/storage.js) — the
// mission plan, roster, gear log, etc. There are exactly two intended users
// (the planner and their BMS manager), so every call, reads included, is
// gated behind one shared-team passcode set via the ADMIN_PASSCODE env var.
// If that var isn't set, refuse everything rather than silently going open.
function checkAuth(event) {
  const configured = process.env.ADMIN_PASSCODE;
  if (!configured) {
    return { ok: false, statusCode: 500, body: JSON.stringify({ error: "Server misconfigured: ADMIN_PASSCODE is not set" }) };
  }
  const headers = event.headers || {};
  const supplied = headers["x-passcode"] || headers["X-Passcode"];
  if (supplied !== configured) {
    return { ok: false, statusCode: 401, body: JSON.stringify({ error: "unauthorized" }) };
  }
  return { ok: true };
}

export async function handler(event) {
  connectLambda(event);

  const auth = checkAuth(event);
  if (!auth.ok) return { statusCode: auth.statusCode, body: auth.body };

  const params = event.queryStringParameters || {};

  try {
    if (event.httpMethod === "GET" && params.list === "true") {
      const prefix = namespacedKey(params.prefix || "");
      const { blobs } = await store().list({ prefix });
      const keys = blobs.map((b) => b.key.slice("shared:".length));
      return { statusCode: 200, body: JSON.stringify({ keys }) };
    }

    if (event.httpMethod === "GET") {
      if (!params.key) return { statusCode: 400, body: "Missing key" };
      const value = await store().get(namespacedKey(params.key));
      if (value === null) return { statusCode: 404, body: "" };
      return { statusCode: 200, body: JSON.stringify({ value }) };
    }

    if (event.httpMethod === "POST") {
      const { key, value } = JSON.parse(event.body || "{}");
      if (!key) return { statusCode: 400, body: "Missing key" };
      await store().set(namespacedKey(key), value);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    if (event.httpMethod === "DELETE") {
      if (!params.key) return { statusCode: 400, body: "Missing key" };
      await store().delete(namespacedKey(params.key));
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, body: "Method not allowed" };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err && err.message || err) }) };
  }
}
