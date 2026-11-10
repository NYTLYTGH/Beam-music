const { createClient } = require("@supabase/supabase-js");
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const FEE = +(process.env.FEE_PERCENT || 20), CUR = process.env.CURRENCY || "GHS";
const ps = (path, opt = {}) => fetch("https://api.paystack.co" + path, { ...opt,
  headers: { Authorization: "Bearer " + process.env.PAYSTACK_SECRET_KEY, "Content-Type": "application/json" } }).then(r => r.json());
const reply = (code, obj) => ({ statusCode: code, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });
async function authUser(e) {
  const t = (e.headers.authorization || "").replace("Bearer ", "");
  if (!t) return null;
  const { data } = await db.auth.getUser(t);
  return (data && data.user) || null;
}
// Confirms the payment with Paystack itself, never trusting the browser, then stores the sale and your fee.
async function record(reference) {
  const v = await ps("/transaction/verify/" + encodeURIComponent(reference));
  const d = v.data;
  if (!d || d.status !== "success") return null;
  const { track_id, buyer } = d.metadata || {};
  const { data: t } = await db.from("tracks").select("id,price").eq("id", track_id).single();
  if (!t || d.amount !== t.price || d.currency !== CUR) return null;
  const fee = Math.round(d.amount * FEE / 100);
  await db.from("purchases").upsert({ reference, track_id, buyer, amount: d.amount, fee, artist_share: d.amount - fee }, { onConflict: "reference" });
  return track_id;
}
module.exports = { db, CUR, ps, reply, authUser, record };
