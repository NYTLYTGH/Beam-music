import { getStore } from "@netlify/blobs";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { profiles } from "../../db/schema.js";
import { userIdFrom } from "../lib/supabase-user.js";

const MAX_BYTES = 1024 * 1024; // images are resized in the browser first; this is a safety cap
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export default async (req: Request) => {
  const store = getStore("avatars");

  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return new Response("Missing id", { status: 400 });
    const res = await store.getWithMetadata(id, { type: "arrayBuffer" });
    if (!res) return new Response("Not found", { status: 404 });
    return new Response(res.data, {
      headers: {
        "Content-Type": String(res.metadata?.contentType || "image/jpeg"),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  if (req.method === "PUT") {
    const uid = await userIdFrom(req);
    if (!uid) return Response.json({ error: "Log in first" }, { status: 401 });
    const type = (req.headers.get("content-type") || "").split(";")[0];
    if (!TYPES.includes(type)) return Response.json({ error: "Use a JPEG, PNG or WebP image" }, { status: 400 });
    const buf = await req.arrayBuffer();
    if (!buf.byteLength || buf.byteLength > MAX_BYTES) return Response.json({ error: "Image is too large" }, { status: 400 });
    await store.set(uid, buf, { metadata: { contentType: type } });
    const [p] = await db
      .insert(profiles)
      .values({ userId: uid, avatarVersion: 1 })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: { avatarVersion: sql`${profiles.avatarVersion} + 1`, updatedAt: new Date() },
      })
      .returning();
    return Response.json(p);
  }

  if (req.method === "DELETE") {
    const uid = await userIdFrom(req);
    if (!uid) return Response.json({ error: "Log in first" }, { status: 401 });
    await store.delete(uid);
    const [p] = await db.update(profiles).set({ avatarVersion: 0, updatedAt: new Date() }).where(eq(profiles.userId, uid)).returning();
    return Response.json(p || null);
  }

  return new Response("Method not allowed", { status: 405 });
};
