import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "olimpiadas-raiz",
      environment: process.env.APP_ENV ?? "unknown",
      revision: process.env.APP_REVISION ?? "unknown",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
