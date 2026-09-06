import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);

    if (error && !String(error.message).toLowerCase().includes("permission")) {
      return NextResponse.json(
        {
          ok: false,
          app: "up",
          database: "error",
          response_ms: Date.now() - started
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        app: "up",
        database: "reachable",
        response_ms: Date.now() - started
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" }
      }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        app: "up",
        database: "unreachable",
        response_ms: Date.now() - started
      },
      { status: 503 }
    );
  }
}
