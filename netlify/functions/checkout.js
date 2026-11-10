const { db, CUR, ps, reply, authUser } = require("../lib/common");
exports.handler = async e => {
  const u = await authUser(e); if (!u) return reply(401, { error: "Log in first" });
  const { track_id } = JSON.parse(e.body || "{}");
  const { data: t } = await db.from("tracks").select("id,title,price").eq("id", track_id).single();
  if (!t || t.price <= 0) return reply(400, { error: "This track is not for sale" });
  const r = await ps("/transaction/initialize", { method: "POST", body: JSON.stringify({
    email: u.email, amount: t.price, currency: CUR,
    callback_url: (process.env.SITE_URL || process.env.URL) + "/",
    metadata: { track_id: t.id, buyer: u.id } }) });
  if (!r.status) return reply(502, { error: r.message });
  return reply(200, { url: r.data.authorization_url });
};
