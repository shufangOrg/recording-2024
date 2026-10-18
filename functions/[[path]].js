// Stream >25MiB audio from R2 so public URLs never change.
// _routes.json gates this handler to exactly the oversized path; all other
// routes fall through to the static assets (return null below = fall through).
const FILES = {
  "/meng-li-hua-luo-zhi-duo-shao/mi-hang-zhi-si.mp3": "ting-2024/meng-li-hua-luo-zhi-duo-shao/mi-hang-zhi-si.mp3"
};

export const onRequest = async (ctx) => {
  const path = new URL(ctx.request.url).pathname;
  const key = FILES[path];
  if (!key) return null; // not one of ours; fall through to static
  const m = (ctx.request.headers.get("range") || "").match(/bytes=(\d+)-(\d*)/);
  let rangeOpts;
  if (m) {
    rangeOpts = { offset: Number(m[1]) };
    if (m[2]) rangeOpts.length = Number(m[2]) - Number(m[1]) + 1;
  }
  const r2 = ctx.env.SHUFA_AUDIO.get(key, rangeOpts ? { range: rangeOpts } : undefined);
  if (!r2) return new Response("R2 not populated yet", { status: 503 });
  const h = new Headers(r2.headers);
  h.set("content-type", "audio/mpeg");
  h.set("cache-control", "public, max-age=31536000, immutable");
  h.set("access-control-allow-origin", "*");
  return new Response(r2.body, { status: r2.status, headers: h });
};
