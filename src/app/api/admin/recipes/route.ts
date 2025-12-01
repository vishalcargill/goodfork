import { NextResponse } from "next/server";

export async function POST(request) {
  return NextResponse.json(
    {
      success: false,
      message: "Database access is disabled in this deployment.",
    },
    { status: 501 }
  );
}
