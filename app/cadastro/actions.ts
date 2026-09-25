"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signupSchema } from "@/lib/security/schemas";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse({
    fullName: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    redirect(
      "/cadastro?error=Confira%20nome,%20email%20e%20use%20uma%20senha%20com%20pelo%20menos%208%20caracteres"
    );
  }

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(`signup:${ip}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!rate.allowed) {
    redirect("/cadastro?error=Muitas%20tentativas%20de%20cadastro.%20Tente%20mais%20tarde.");
  }

  const origin = headerStore.get("origin") ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/cadastro?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    redirect(
      "/login?message=Cadastro%20realizado.%20Confira%20seu%20email%20para%20confirmar%20a%20conta."
    );
  }

  if (data.user?.id) {
    await supabase
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          email,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
  }

  redirect("/dashboard");
}
