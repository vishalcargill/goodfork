import { NextResponse } from "next/server";

// All DB-dependent logic stubbed for deployment

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "Database access is disabled in this deployment.",
    },
    { status: 501 }
  );
}

export async function POST(request: Request) {
  return NextResponse.json(
    {
      success: false,
      message: "Database access is disabled in this deployment.",
    },
    { status: 501 }
  );
}
}
