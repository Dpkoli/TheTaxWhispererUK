"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sourceChangeFlags, sources } from "@/db/schema";
import { auth } from "@/lib/auth";
import { runMockIngestion } from "@/lib/ingestion/mock-ingestion";

async function requireSignedIn() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Sign in to use the ingestion pipeline admin tools");
  }
  return session;
}

export async function triggerIngestion() {
  await requireSignedIn();
  await runMockIngestion();
  revalidatePath("/admin/ingestion");
}

export async function reviewFlag(flagId: string, decision: "approved" | "rejected") {
  await requireSignedIn();

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
