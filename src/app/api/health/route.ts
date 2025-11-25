import { NextResponse } from "next/server";

import { getHealthSnapshot } from "@/services/server/health.server";

export async function GET() {
  const snapshot = await getHealthSnapshot();
  return NextResponse.json(snapshot);
}
