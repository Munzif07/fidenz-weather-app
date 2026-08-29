import { NextResponse } from "next/server";
import { weatherCache } from "@/lib/cache";
import { auth0 } from "@/lib/auth0";

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ttlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? 300),
    entries: weatherCache.status(),
  });
}
