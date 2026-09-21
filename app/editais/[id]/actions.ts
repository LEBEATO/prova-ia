"use server";

import { analyzeNoticePdf } from "@/lib/ai/analyze-notice";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function safeDate(value: string) {
  if (!value) return null;
  const match = value.match(/^\d{4}-\d{2}-\d{2}$/);
  return match ? value : null;
}

export async function analyzeNotice(formData: FormData) {
  const noticeId = String(formData.get("notice_id") ?? "");

  if (!noticeId) {
    redirect("/editais?error=Edital%20inválido");
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const userId = claimsData.claims.sub;

  const { data: notice, error: noticeError } = await supabase
    .from("notices")
    .select("id, file_path")
    .eq("id", noticeId)
    .maybeSingle();

  if (noticeError || !notice?.file_path) {
    redirect(`/editais/${noticeId}?error=Não%20foi%20possível%20localizar%20o%20PDF`);
  }

  await supabase
    .from("notices")
    .update({ analysis_status: "processing" })
    .eq("id", noticeId);

  try {
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("editais")
      .createSignedUrl(notice.file_path, 600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error("Não foi possível gerar acesso temporário ao PDF.");
    }

    const analysis = await analyzeNoticePdf(signedUrlData.signedUrl);

    const { error: analysisError } = await supabase
      .from("notice_analyses")
      .upsert(
        {
          notice_id: noticeId,
          user_id: userId,
          board_name: analysis.board_name || null,
          organization_name: analysis.organization_name || null,
          city: analysis.city || null,
          state: analysis.state || null,
          position_name: analysis.position_name || null,
          exam_date: safeDate(analysis.exam_date),
          total_questions: analysis.total_questions || null,
          summary: analysis.summary || null,
          confidence: analysis.confidence || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "notice_id" }
      );

    if (analysisError) {
      throw analysisError;
    }

    const { error: deleteTopicsError } = await supabase
      .from("notice_topics")
      .delete()
      .eq("notice_id", noticeId);

    if (deleteTopicsError) {
      throw deleteTopicsError;
    }

    if (analysis.topics.length) {
      const { error: topicsError } = await supabase.from("notice_topics").insert(
        analysis.topics.map((topic) => ({
          notice_id: noticeId,
          category: topic.category || "Conteúdo",
          subject: topic.subject || "Não identificado",
          subtopic: topic.subtopic || null,
          expected_questions: topic.expected_questions || null,
          weight: topic.weight || null,
          source_reference: topic.source_reference || null,
        }))
      );

      if (topicsError) {
        throw topicsError;
      }
    }

    const { error: updateNoticeError } = await supabase
      .from("notices")
      .update({
        analysis_status: "completed",
        exam_date: safeDate(analysis.exam_date),
      })
      .eq("id", noticeId);

    if (updateNoticeError) {
      throw updateNoticeError;
    }

    revalidatePath("/editais");
    revalidatePath(`/editais/${noticeId}`);
  } catch (error) {
    await supabase
      .from("notices")
      .update({ analysis_status: "failed" })
      .eq("id", noticeId);

    const message =
      error instanceof Error ? error.message : "Falha ao analisar o edital.";

    redirect(`/editais/${noticeId}?error=${encodeURIComponent(message)}`);
  }

  redirect(`/editais/${noticeId}?success=1`);
}
