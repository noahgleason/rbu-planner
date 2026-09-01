// Storage adapter.
//
// Three tiers, tried in order:
// 1. Inside a Claude.ai artifact, `window.storage` is provided by the host
//    and persists data server-side (personal vs. shared).
// 2. Deployed on Netlify (or running `netlify dev` locally), shared data
//    goes through a Netlify Function backed by Netlify Blobs (see
//    netlify/functions/storage.js), so it syncs across every teammate's
//    device. Personal data — just the "which roster person am I" pointer —
//    has no login system to key a server record to, so it always stays in
//    this device's localStorage regardless of tier.
// 3. Running the plain Vite dev server (`npm run dev`, not `netlify dev`)
//    has no Function to call, so shared reads/writes will fail gracefully
//    (the app already falls back to seed data / a non-persisted "Saved"
//    state on storage errors) — fine for quick UI iteration, but use
//    `netlify dev` to actually exercise sync locally.

function hasHostStorage() {
  return typeof window !== "undefined" && window.storage && typeof window.storage.get === "function";
}

function localKey(key, shared) {
  return `mission-portal:${shared ? "shared" : "personal"}:${key}`;
}

const localStorageAdapter = {
  async get(key, shared = false) {
    const raw = window.localStorage.getItem(localKey(key, shared));
    if (raw === null) throw new Error("not found");
    return { key, value: raw, shared };
  },
  async set(key, value, shared = false) {
    window.localStorage.setItem(localKey(key, shared), value);
    return { key, value, shared };
  },
  async delete(key, shared = false) {
    window.localStorage.removeItem(localKey(key, shared));
    return { key, deleted: true, shared };
  },
  async list(prefix = "", shared = false) {
    const wanted = `mission-portal:${shared ? "shared" : "personal"}:${prefix}`;
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(wanted)) keys.push(k.slice(`mission-portal:${shared ? "shared" : "personal"}:`.length));
    }
    return { keys, prefix, shared };
  },
};

const FUNCTION_URL = "/.netlify/functions/storage";

const netlifyAdapter = {
  async get(key, shared = false) {
    const res = await fetch(`${FUNCTION_URL}?key=${encodeURIComponent(key)}&shared=${shared}`);
    if (res.status === 404) throw new Error("not found");
    if (!res.ok) throw new Error(`storage get failed (${res.status})`);
    const data = await res.json();
    return { key, value: data.value, shared };
  },
  async set(key, value, shared = false) {
    const res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value, shared }),
    });
    if (!res.ok) throw new Error(`storage set failed (${res.status})`);
    return { key, value, shared };
  },
  async delete(key, shared = false) {
    const res = await fetch(`${FUNCTION_URL}?key=${encodeURIComponent(key)}&shared=${shared}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`storage delete failed (${res.status})`);
    return { key, deleted: true, shared };
  },
  async list(prefix = "", shared = false) {
    const res = await fetch(`${FUNCTION_URL}?list=true&prefix=${encodeURIComponent(prefix)}&shared=${shared}`);
    if (!res.ok) throw new Error(`storage list failed (${res.status})`);
    const data = await res.json();
    return { keys: data.keys, prefix, shared };
  },
};

// Shared data syncs through the Netlify Function; personal data always
// stays on this device, since there's no login system to key it to.
const netlifyBackedStorage = {
  get: (key, shared = false) => (shared ? netlifyAdapter.get(key, shared) : localStorageAdapter.get(key, shared)),
  set: (key, value, shared = false) =>
    shared ? netlifyAdapter.set(key, value, shared) : localStorageAdapter.set(key, value, shared),
  delete: (key, shared = false) => (shared ? netlifyAdapter.delete(key, shared) : localStorageAdapter.delete(key, shared)),
  list: (prefix, shared = false) => (shared ? netlifyAdapter.list(prefix, shared) : localStorageAdapter.list(prefix, shared)),
};

const storage = hasHostStorage() ? window.storage : netlifyBackedStorage;

export default storage;
