"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { userLearningProgress } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function markChapterComplete(chapterId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Sign in to track your progress");
  }

  const existing = await db.query.userLearningProgress.findFirst({
    where: and(
      eq(userLearningProgress.userId, session.user.id),
      eq(userLearningProgress.chapterId, chapterId),
    ),
  });

  if (existing) {
    await db
      .update(userLearningProgress)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(userLearningProgress.id, existing.id));
  } else {
    await db.insert(userLearningProgress).values({
      userId: session.user.id,
      chapterId,
      status: "completed",
    });
  }

  revalidatePath(`/learning/${chapterId}`);
  revalidatePath("/learning");
}
