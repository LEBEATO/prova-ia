import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (user?.id) {
        const fullName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name.trim()
            : "";

        if (fullName) {
          await supabase
            .from("profiles")
            .upsert(
              {
                id: user.id,
                email: user.email ?? null,
                full_name: fullName,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" }
            );
        }
      }

      return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=Não%20foi%20possível%20confirmar%20o%20acesso", requestUrl.origin)
  );
}
