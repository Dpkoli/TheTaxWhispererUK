import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("display_name"),
  image: text("image"),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  isGuestUpgraded: boolean("is_guest_upgraded").notNull().default(false),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
