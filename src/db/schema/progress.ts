import { integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { learningProgressStatusEnum } from "./enums";
import { learningChapters, learningSections } from "./learning";
import { users } from "./user";

export const userLearningProgress = pgTable("user_learning_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  chapterId: uuid("chapter_id")
    .notNull()
    .references(() => learningChapters.id, { onDelete: "cascade" }),
  status: learningProgressStatusEnum("status").notNull().default("not_started"),
  lastSectionId: uuid("last_section_id").references(() => learningSections.id, {
    onDelete: "set null",
  }),
  quizScore: integer("quiz_score"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
