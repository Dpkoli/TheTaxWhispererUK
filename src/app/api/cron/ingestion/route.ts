import { NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingestion/real-ingestion";

export const maxDuration = 60;

/**
 * Scheduled entry point for the ingestion pipeline (see vercel.json for the
 * cron schedule). Vercel signs cron requests with an `Authorization: Bearer
 * <CRON_SECRET>` header when the CRON_SECRET env var is set — this rejects
 * any request that doesn't present it, so the endpoint can't be triggered
 * by an outsider hitting the URL directly.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const results = await runIngestion();
  return NextResponse.json({ ok: true, results });
}
