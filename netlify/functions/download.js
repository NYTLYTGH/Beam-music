const { db, reply, authUser } = require("../lib/common");
exports.handler = async e => {
  const u = await authUser(e); if (!u) return reply(401, { error: "Log in first" });
  const q = e.queryStringParameters || {};
  const { data: t } = await db.from("tracks").select("*").eq("id", q.track_id).single();
  if (!t) return reply(404, { error: "Track not found" });
  let ok = t.price === 0 || t.owner === u.id;
  if (!ok) {
    const { data: p } = await db.from("purchases").select("id").eq("track_id", t.id).eq("buyer", u.id).limit(1);
    ok = !!(p && p.length);
  }
  if (!ok) return reply(403, { error: "Buy this track first" });
  const { data, error } = await db.storage.from("audio").createSignedUrl(t.path, 300, q.dl ? { download: t.title } : undefined);
  return error ? reply(500, { error: error.message }) : reply(200, { url: data.signedUrl });
};
