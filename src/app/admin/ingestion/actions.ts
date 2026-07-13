"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sourceChangeFlags, sources } from "@/db/schema";
import { auth } from "@/lib/auth";
import { runIngestion } from "@/lib/ingestion/real-ingestion";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Admin access required to use the ingestion pipeline tools");
  }
  return session;
}

export async function triggerIngestion() {
  await requireAdmin();
  await runIngestion();
  revalidatePath("/admin/ingestion");
}

export async function reviewFlag(flagId: string, decision: "approved" | "rejected") {
  await requireAdmin();

  const flag = await db.query.sourceChangeFlags.findFirst({
    where: eq(sourceChangeFlags.id, flagId),
  });
  if (!flag) throw new Error("Flag not found");

  await db
    .update(sourceChangeFlags)
    .set({ reviewStatus: decision })
    .where(eq(sourceChangeFlags.id, flagId));

  if (decision === "approved") {
    await db
      .update(sources)
      .set({ lastVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(sources.id, flag.sourceId));
  }

  revalidatePath("/admin/ingestion");
  revalidatePath("/changelog");
}
