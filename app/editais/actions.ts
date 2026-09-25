"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadNoticeSchema } from "@/lib/security/schemas";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function uploadNotice(formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const userId = claimsData.claims.sub;
  const file = formData.get("file");
  const parsed = uploadNoticeSchema.safeParse({
    title: String(formData.get("title") ?? ""),
  });

  if (!parsed.success) {
    redirect("/editais?error=Título%20inválido");
  }

  const customTitle = parsed.data.title;

  if (!(file instanceof File) || file.size === 0) {
    redirect("/editais?error=Selecione%20um%20arquivo%20PDF");
  }

  if (file.type !== "application/pdf") {
    redirect("/editais?error=O%20arquivo%20precisa%20ser%20um%20PDF");
  }

  const signatureBuffer = await file.slice(0, 5).arrayBuffer();
  const signature = new TextDecoder().decode(signatureBuffer);
  if (signature !== "%PDF-") {
    redirect("/editais?error=O%20arquivo%20enviado%20não%20é%20um%20PDF%20válido");
  }

  if (file.size > MAX_FILE_SIZE) {
    redirect("/editais?error=O%20PDF%20deve%20ter%20no%20máximo%2020%20MB");
  }

  const safeName = file.name
    .replace(/\.pdf$/i, "")
    .replace(/[^a-zA-Z0-9À-ÿ._ -]/g, "")
    .trim();

  const title = customTitle || safeName || "Edital";
  const storagePath = `${userId}/${crypto.randomUUID()}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("editais")
    .upload(storagePath, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    redirect(
      `/editais?error=${encodeURIComponent(
        "Não foi possível enviar o PDF. Verifique se o bucket editais foi criado."
      )}`
    );
  }

  const { error: insertError } = await supabase.from("notices").insert({
    user_id: userId,
    title,
    file_path: storagePath,
    analysis_status: "pending",
  });

  if (insertError) {
    await supabase.storage.from("editais").remove([storagePath]);
    redirect(
      `/editais?error=${encodeURIComponent(
        "O PDF foi enviado, mas não foi possível salvar o edital."
      )}`
    );
  }

  revalidatePath("/editais");
  redirect("/editais?success=Edital%20enviado%20com%20sucesso");
}
