import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

// Public artist/listener profiles. user_id is the Supabase auth user id.
export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  phone: text("phone").notNull().default(""), // private: never returned by public endpoints
  displayName: text("display_name").notNull().default(""),
  about: text("about").notNull().default(""),
  location: text("location").notNull().default(""),
  website: text("website").notNull().default(""),
  instagram: text("instagram").notNull().default(""),
  avatarVersion: integer("avatar_version").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
