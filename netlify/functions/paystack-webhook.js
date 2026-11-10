const crypto = require("crypto");
const { reply, record } = require("../lib/common");
exports.handler = async e => {
  const raw = e.isBase64Encoded ? Buffer.from(e.body, "base64").toString() : e.body;
  const sig = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(raw).digest("hex");
  if (sig !== e.headers["x-paystack-signature"]) return reply(401, {});
  const ev = JSON.parse(raw);
  if (ev.event === "charge.success") await record(ev.data.reference);
  return reply(200, { ok: true });
};
