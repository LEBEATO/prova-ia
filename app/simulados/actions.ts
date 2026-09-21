"use server";

import { createClient } from "@/lib/supabase/server";
import { buildMockQuestions } from "@/lib/simulations/mock";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function normalizeCount(value: FormDataEntryValue | null) {
  const count = Number(value);
  return [10, 20, 30].includes(count) ? count : 30;
}

export async function createSimulation(formData: FormData) {
  const noticeId = String(formData.get("notice_id") ?? "");
  const questionCount = normalizeCount(formData.get("question_count"));

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const userId = claimsData.claims.sub;

  const { data: notice } = await supabase
    .from("notices")
    .select("id, title, analysis_status")
    .eq("id", noticeId)
    .maybeSingle();

  if (!notice || notice.analysis_status !== "completed") {
    redirect("/simulados/novo?error=Selecione%20um%20edital%20já%20analisado");
  }

  const { data: topics } = await supabase
    .from("notice_topics")
    .select("category, subject, subtopic, expected_questions")
    .eq("notice_id", noticeId);

  const { data: simulation, error: simulationError } = await supabase
    .from("simulations")
    .insert({
      user_id: userId,
      notice_id: noticeId,
      title: `Simulado - ${notice.title}`,
      question_count: questionCount,
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (simulationError || !simulation) {
    redirect("/simulados/novo?error=Não%20foi%20possível%20criar%20o%20simulado");
  }

  const generated = buildMockQuestions(topics ?? [], questionCount);

  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .insert(
      generated.map((question) => ({
        ...question,
        created_by: userId,
      }))
    )
    .select("id");

  if (questionError || !questions || questions.length !== questionCount) {
    await supabase.from("simulations").delete().eq("id", simulation.id);
    redirect("/simulados/novo?error=Não%20foi%20possível%20gerar%20as%20questões");
  }

  const { error: linkError } = await supabase.from("simulation_questions").insert(
    questions.map((question, index) => ({
      simulation_id: simulation.id,
      question_id: question.id,
      position: index + 1,
    }))
  );

  if (linkError) {
    await supabase.from("simulations").delete().eq("id", simulation.id);
    redirect("/simulados/novo?error=Não%20foi%20possível%20montar%20o%20simulado");
  }

  revalidatePath("/simulados");
  redirect(`/simulados/${simulation.id}`);
}

export async function submitSimulation(formData: FormData) {
  const simulationId = String(formData.get("simulation_id") ?? "");
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const userId = claimsData.claims.sub;

  const { data: simulation } = await supabase
    .from("simulations")
    .select("id, user_id, status")
    .eq("id", simulationId)
    .maybeSingle();

  if (!simulation || simulation.user_id !== userId) {
    redirect("/simulados");
  }

  if (simulation.status === "completed") {
    redirect(`/simulados/${simulationId}`);
  }

  const { data: links } = await supabase
    .from("simulation_questions")
    .select("id, question_id, position")
    .eq("simulation_id", simulationId)
    .order("position");

  if (!links?.length) {
    redirect(`/simulados/${simulationId}?error=Simulado%20sem%20questões`);
  }

  const questionIds = links.map((item) => item.question_id).filter(Boolean) as string[];
  const { data: questions } = await supabase
    .from("questions")
    .select("id, subject, topic, subtopic, correct_answer")
    .in("id", questionIds);

  const questionMap = new Map((questions ?? []).map((question) => [question.id, question]));
  let correctCount = 0;

  const answers = links.map((link) => {
    const question = link.question_id ? questionMap.get(link.question_id) : null;
    const selected = String(formData.get(`answer_${link.id}`) ?? "");
    const isCorrect = Boolean(
      question && selected && selected === question.correct_answer
    );

    if (isCorrect) correctCount += 1;

    return {
      user_id: userId,
      simulation_id: simulationId,
      simulation_question_id: link.id,
      selected_answer: selected || null,
      correct: isCorrect,
    };
  });

  const { error: answerError } = await supabase
    .from("user_answers")
    .upsert(answers, { onConflict: "user_id,simulation_question_id" });

  if (answerError) {
    redirect(`/simulados/${simulationId}?error=Não%20foi%20possível%20salvar%20as%20respostas`);
  }

  const performanceGroups = new Map<
    string,
    {
      subject: string;
      topic: string;
      subtopic: string;
      total: number;
      correct: number;
    }
  >();

  for (const link of links) {
    if (!link.question_id) continue;
    const question = questionMap.get(link.question_id);
    if (!question) continue;

    const subject = question.subject || "Não identificado";
    const topic = question.topic || "Geral";
    const subtopic = question.subtopic || "Geral";
    const selected = String(formData.get(`answer_${link.id}`) ?? "");
    const hit = selected === question.correct_answer;
    const key = `${subject}||${topic}||${subtopic}`;

    const current = performanceGroups.get(key) ?? {
      subject,
      topic,
      subtopic,
      total: 0,
      correct: 0,
    };

    current.total += 1;
    if (hit) current.correct += 1;
    performanceGroups.set(key, current);
  }

  for (const group of performanceGroups.values()) {
    const { data: existing } = await supabase
      .from("user_performance")
      .select("id, total_answers, correct_answers, wrong_answers")
      .eq("user_id", userId)
      .eq("subject", group.subject)
      .eq("topic", group.topic)
      .eq("subtopic", group.subtopic)
      .maybeSingle();

    const total = (existing?.total_answers ?? 0) + group.total;
    const correct = (existing?.correct_answers ?? 0) + group.correct;
    const wrong = (existing?.wrong_answers ?? 0) + (group.total - group.correct);
    const accuracy = total > 0 ? Number(((correct / total) * 100).toFixed(2)) : 0;

    if (existing?.id) {
      await supabase
        .from("user_performance")
        .update({
          total_answers: total,
          correct_answers: correct,
          wrong_answers: wrong,
          accuracy,
          last_answered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("user_performance").insert({
        user_id: userId,
        subject: group.subject,
        topic: group.topic,
        subtopic: group.subtopic,
        total_answers: total,
        correct_answers: correct,
        wrong_answers: wrong,
        accuracy,
        last_answered_at: new Date().toISOString(),
      });
    }
  }

  const totalQuestions = links.length;
  const wrongCount = totalQuestions - correctCount;
  const score = Number(((correctCount / totalQuestions) * 100).toFixed(2));

  await supabase
    .from("simulations")
    .update({
      status: "completed",
      score,
      correct_answers: correctCount,
      wrong_answers: wrongCount,
      completed_at: new Date().toISOString(),
    })
    .eq("id", simulationId);

  revalidatePath("/simulados");
  revalidatePath(`/simulados/${simulationId}`);
  revalidatePath("/desempenho");
  redirect(`/simulados/${simulationId}?completed=1`);
}
