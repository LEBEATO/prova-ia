import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=Não%20foi%20possível%20confirmar%20o%20acesso", requestUrl.origin)
  );
}
