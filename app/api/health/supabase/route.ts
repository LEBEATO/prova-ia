import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return Response.json(
      { ok: false, error: "Supabase environment variables are missing" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const startedAt = Date.now();
  const { data, error } = await supabase.rpc("health_ping");

  if (error) {
    console.error("Supabase health check failed:", error.message);

    return Response.json(
      {
        ok: false,
        service: "supabase",
        error: error.message,
      },
      { status: 503 }
    );
  }

  return Response.json({
    ok: true,
    service: "supabase",
    databaseTime: data,
    latencyMs: Date.now() - startedAt,
    checkedAt: new Date().toISOString(),
  });
}
