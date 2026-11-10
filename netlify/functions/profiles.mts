import { eq, inArray, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { profiles } from "../../db/schema.js";
import { userIdFrom } from "../lib/supabase-user.js";

type Row = typeof profiles.$inferSelect;
const LIMITS = { firstName: 50, lastName: 50, phone: 30, displayName: 60, about: 1500, location: 80, website: 200, instagram: 60 } as const;
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
// Public view: phone number is private to the owner.
const pub = ({ phone, ...rest }: Row) => rest;

export default async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    if (url.searchParams.has("mine")) {
      const uid = await userIdFrom(req);
      if (!uid) return Response.json({ error: "Log in first" }, { status: 401 });
      const [p] = await db.select().from(profiles).where(eq(profiles.userId, uid));
      return Response.json(p || null);
    }
    const id = url.searchParams.get("id");
    const ids = url.searchParams.get("ids");
    if (id) {
      const [p] = await db.select().from(profiles).where(eq(profiles.userId, id));
      return Response.json(p ? pub(p) : null);
    }
    if (ids) {
      const list = ids.split(",").filter(Boolean).slice(0, 200);
      if (!list.length) return Response.json([]);
      return Response.json((await db.select().from(profiles).where(inArray(profiles.userId, list))).map(pub));
    }
    return Response.json((await db.select().from(profiles).orderBy(desc(profiles.updatedAt)).limit(200)).map(pub));
  }

  if (req.method === "PUT") {
    const uid = await userIdFrom(req);
    if (!uid) return Response.json({ error: "Log in first" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    // Only fields present in the request are changed.
    const values: Partial<Row> = { updatedAt: new Date() };
    for (const k of Object.keys(LIMITS) as (keyof typeof LIMITS)[]) {
      if (k in body) (values as any)[k] = clean(body[k], LIMITS[k]);
    }
    if (values.website && !/^https?:\/\//i.test(values.website)) values.website = "https://" + values.website;
    if (values.instagram) values.instagram = values.instagram.replace(/^@/, "");
    if (values.phone) values.phone = values.phone.replace(/[^\d+\s()-]/g, "");
    const [p] = await db
      .insert(profiles)
      .values({ userId: uid, ...values })
      .onConflictDoUpdate({ target: profiles.userId, set: values })
      .returning();
    return Response.json(p);
  }

  return new Response("Method not allowed", { status: 405 });
};
