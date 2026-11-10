// Lets an artist edit or delete one of their own uploaded songs.
// PATCH /api/track?id=...  body: { title?, artist?, price? }   (price in pesewas)
// DELETE /api/track?id=...  removes the song and its audio file
const { db, reply, authUser } = require("../lib/common");

exports.handler = async e => {
  const u = await authUser(e); if (!u) return reply(401, { error: "Log in first" });
  const id = (e.queryStringParameters || {}).id;
  if (!id) return reply(400, { error: "Missing song id" });
  const { data: t } = await db.from("tracks").select("*").eq("id", id).maybeSingle();
  if (!t) return reply(404, { error: "Song not found" });
  if (t.owner !== u.id) return reply(403, { error: "You can only change your own songs" });

  if (e.httpMethod === "PATCH") {
    let b = {}; try { b = JSON.parse(e.body || "{}"); } catch {}
    const v = {};
    if (typeof b.title === "string") v.title = b.title.trim().slice(0, 120);
    if (typeof b.artist === "string") v.artist = b.artist.trim().slice(0, 120);
    if (b.price !== undefined) v.price = Math.max(0, Math.round(+b.price || 0));
    if (v.title === "" || v.artist === "") return reply(400, { error: "Title and artist name can't be empty" });
    const { data, error } = await db.from("tracks").update(v).eq("id", id).select().single();
    return error ? reply(500, { error: error.message }) : reply(200, data);
  }

  if (e.httpMethod === "DELETE") {
    const { error } = await db.from("tracks").delete().eq("id", id);
    if (error) return reply(500, { error: error.message });
    await db.storage.from("audio").remove([t.path]); // best effort; the song is already gone
    return reply(200, { ok: true });
  }

  return reply(405, { error: "Method not allowed" });
};
