const { reply, authUser, record } = require("../lib/common");
exports.handler = async e => {
  if (!(await authUser(e))) return reply(401, { error: "Log in first" });
  const { reference } = JSON.parse(e.body || "{}");
  const id = await record(reference);
  return id ? reply(200, { track_id: id }) : reply(400, { error: "Payment not confirmed" });
};
