// Storage adapter.
//
// Inside a Claude.ai artifact, `window.storage` is provided by the host and
// persists data server-side (personal vs. shared). Outside that environment
// (this standalone build, GitHub Pages, Vercel, etc.) there is no such API,
// so this falls back to localStorage. The two have the same shape, so the
// rest of the app never needs to know which one it's talking to.
//
// NOTE: the localStorage fallback is single-browser only -- it will NOT sync
// data between teammates on different devices. For real multi-user sync
// outside of claude.ai you'd want a small backend (see README "Next steps").

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

const storage = hasHostStorage() ? window.storage : localStorageAdapter;

export default storage;
