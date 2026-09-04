/* ---------------------------------------------------------------
   Cloudflare Pages Function: /api/storage/:key
   Backed by a Cloudflare KV namespace bound as PMG_KV.

   GET    -> { key, value }        (value is null if not set)
   PUT    -> body: { value }       stores value, returns { key, ok }
   DELETE -> deletes the key,      returns { ok }

   Set up the KV binding in the Cloudflare dashboard:
   Pages project -> Settings -> Functions -> KV namespace bindings
   -> add binding named exactly "PMG_KV" pointing at your KV
   namespace. See README.md for full steps.
----------------------------------------------------------------*/

export async function onRequestGet(context) {
  const { params, env } = context;
  if (!env.PMG_KV) {
    return new Response(JSON.stringify({ error: "KV namespace 'PMG_KV' is not bound. See README.md." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const value = await env.PMG_KV.get(params.key);
  return new Response(JSON.stringify({ key: params.key, value }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPut(context) {
  const { params, env, request } = context;
  if (!env.PMG_KV) {
    return new Response(JSON.stringify({ error: "KV namespace 'PMG_KV' is not bound. See README.md." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const body = await request.json();
  await env.PMG_KV.put(params.key, body.value);
  return new Response(JSON.stringify({ key: params.key, ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestDelete(context) {
  const { params, env } = context;
  if (!env.PMG_KV) {
    return new Response(JSON.stringify({ error: "KV namespace 'PMG_KV' is not bound. See README.md." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  await env.PMG_KV.delete(params.key);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
