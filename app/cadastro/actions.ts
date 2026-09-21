"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signup(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || password.length < 6) {
    redirect(
      "/cadastro?error=Preencha%20os%20campos%20e%20use%20uma%20senha%20com%20pelo%20menos%206%20caracteres"
    );
  }

  const supabase = await createClient();
  const headerStore = await headers();
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

  redirect("/dashboard");
}
