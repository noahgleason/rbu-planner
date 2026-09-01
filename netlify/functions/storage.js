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

export async function handler(event) {
  connectLambda(event);

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
