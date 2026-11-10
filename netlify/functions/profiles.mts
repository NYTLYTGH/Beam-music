import { eq, inArray, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { profiles } from "../../db/schema.js";
import { userIdFrom } from "../lib/supabase-user.js";

const LIMITS = { displayName: 60, about: 1500, location: 80, website: 200, instagram: 60 } as const;
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export default async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const id = url.searchParams.get("id");
    const ids = url.searchParams.get("ids");
    if (id) {
      const [p] = await db.select().from(profiles).where(eq(profiles.userId, id));
      return Response.json(p || null);
    }
    if (ids) {
      const list = ids.split(",").filter(Boolean).slice(0, 200);
      if (!list.length) return Response.json([]);
      return Response.json(await db.select().from(profiles).where(inArray(profiles.userId, list)));
    }
    return Response.json(await db.select().from(profiles).orderBy(desc(profiles.updatedAt)).limit(200));
  }

  if (req.method === "PUT") {
    const uid = await userIdFrom(req);
    if (!uid) return Response.json({ error: "Log in first" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    let website = clean(body.website, LIMITS.website);
    if (website && !/^https?:\/\//i.test(website)) website = "https://" + website;
    const values = {
      displayName: clean(body.displayName, LIMITS.displayName),
      about: clean(body.about, LIMITS.about),
      location: clean(body.location, LIMITS.location),
      website,
      instagram: clean(body.instagram, LIMITS.instagram).replace(/^@/, ""),
      updatedAt: new Date(),
    };
    const [p] = await db
      .insert(profiles)
      .values({ userId: uid, ...values })
      .onConflictDoUpdate({ target: profiles.userId, set: values })
      .returning();
    return Response.json(p);
  }

  return new Response("Method not allowed", { status: 405 });
};
