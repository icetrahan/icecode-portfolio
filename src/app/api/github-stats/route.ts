import { NextResponse } from "next/server";
import { getGitHubStats } from "@/lib/githubStats";

// Kept for client-side refresh / external consumers. The homepage itself now
// renders these stats server-side (see getGitHubStats), so they're present on
// first paint — this route shares the exact same cached fetch.
export const revalidate = 3600;

export async function GET() {
  const data = await getGitHubStats();
  if (!data) {
    return NextResponse.json({ error: "unavailable" }, { status: 200 });
  }
  return NextResponse.json(data);
}
