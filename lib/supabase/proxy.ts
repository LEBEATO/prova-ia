import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.getClaims();

  if (error) {
    const authCookies = request.cookies
      .getAll()
      .filter(
        ({ name }) =>
          name.startsWith("sb-") && name.includes("auth-token")
      );

    authCookies.forEach(({ name }) => {
      request.cookies.delete(name);
      response.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
      });
    });
  }

  return response;
}
