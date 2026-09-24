"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function translateLoginError(code?: string, message?: string) {
  if (code === "email_not_confirmed" || message?.toLowerCase().includes("email not confirmed")) {
    return "Seu email ainda não foi confirmado. Abra a mensagem do Supabase e confirme sua conta.";
  }

  if (code === "invalid_credentials" || message?.toLowerCase().includes("invalid login credentials")) {
    return "Email ou senha inválidos. Confira os dados digitados.";
  }

  if (code === "over_request_rate_limit" || message?.toLowerCase().includes("rate limit")) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  }

  return message || "Não foi possível entrar. Tente novamente.";
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Preencha%20email%20e%20senha");
  }

  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const authCode = "code" in error && typeof error.code === "string" ? error.code : undefined;
    const friendlyMessage = translateLoginError(authCode, error.message);
    redirect(`/login?error=${encodeURIComponent(friendlyMessage)}`);
  }

  const user = authData.user;
  const fullName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";

  if (user?.id && fullName) {
    await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? email,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
  }

  redirect("/dashboard");
}
