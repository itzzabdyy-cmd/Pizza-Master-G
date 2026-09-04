/* ---------------------------------------------------------------
   Storage client for the standalone deployment.

   Talks to a Cloudflare Pages Function (functions/api/storage/[key].js)
   which reads/writes a Cloudflare KV namespace. This gives every
   visitor (customers AND the admin) the same shared, persistent
   data — exactly like a real database — with no separate backend
   service required, since it runs on Cloudflare Pages itself.

   If the API can't be reached (e.g. the KV namespace hasn't been
   bound yet — see README.md), these functions fail gracefully and
   the app falls back to local-only behavior for that session.
----------------------------------------------------------------*/

const API_BASE = "/api/storage";

export async function storageGet(key) {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.value === null || data.value === undefined) return null;
    return JSON.parse(data.value);
  } catch (e) {
    return null;
  }
}

export async function storageSet(key, value) {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(value) }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
