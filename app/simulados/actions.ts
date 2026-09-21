"use server";

import { createClient } from "@/lib/supabase/server";
import { buildMockQuestions } from "@/lib/simulations/mock";
import { difficultySchedule, profileForMode, type DifficultyMode } from "@/lib/simulations/adaptive";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function normalizeCount(value: FormDataEntryValue | null) {
  const count = Number(value);
  return [10, 20, 30].includes(count) ? count : 30;
}

export async function createSimulation(formData: FormData) {
  const noticeId = String(formData.get("notice_id") ?? "");
  const questionCount = normalizeCount(formData.get("question_count"));
  const requestedMode = String(formData.get("difficulty_mode") ?? "adaptive") as DifficultyMode;
  const difficultyMode: DifficultyMode = ["adaptive", "beginner", "intermediate", "advanced", "board"].includes(requestedMode)
    ? requestedMode
    : "adaptive";

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

  const [{ data: topics }, completedResult, { data: performanceRows }] = await Promise.all([
    supabase
      .from("notice_topics")
      .select("category, subject, subtopic, expected_questions")
      .eq("notice_id", noticeId),
    supabase
      .from("simulations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("user_performance")
      .select("total_answers, correct_answers")
      .eq("user_id", userId),
  ]);

  const completedSimulations = completedResult.count ?? 0;
  const performanceTotals = (performanceRows ?? []).reduce(
    (acc, row) => ({
      total: acc.total + Number(row.total_answers ?? 0),
      correct: acc.correct + Number(row.correct_answers ?? 0),
    }),
    { total: 0, correct: 0 }
  );
  const averageAccuracy =
    performanceTotals.total > 0
      ? (performanceTotals.correct / performanceTotals.total) * 100
      : 0;

  const difficulty = profileForMode(
    difficultyMode,
    completedSimulations,
    averageAccuracy
  );
  const schedule = difficultySchedule(questionCount, difficulty.profile);

  const { data: simulation, error: simulationError } = await supabase
    .from("simulations")
    .insert({
      user_id: userId,
      notice_id: noticeId,
      title: `Simulado - ${notice.title}`,
      question_count: questionCount,
      status: "in_progress",
      started_at: new Date().toISOString(),
      difficulty_mode: difficultyMode,
      difficulty_level: difficulty.level,
      difficulty_profile: difficulty.profile,
      sequence_number: completedSimulations + 1,
    })
    .select("id")
    .single();

  if (simulationError || !simulation) {
    redirect("/simulados/novo?error=Não%20foi%20possível%20criar%20o%20simulado");
  }

  const generated = buildMockQuestions(topics ?? [], questionCount, schedule);

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


export async function deleteSimulation(formData: FormData) {
  const simulationId = String(formData.get("simulation_id") ?? "");
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const userId = claimsData.claims.sub;

  const { data: simulation } = await supabase
    .from("simulations")
    .select("id, user_id")
    .eq("id", simulationId)
    .maybeSingle();

  if (!simulation || simulation.user_id !== userId) {
    redirect("/simulados");
  }

  const { data: links } = await supabase
    .from("simulation_questions")
    .select("id, question_id")
    .eq("simulation_id", simulationId);

  const linkIds = (links ?? []).map((item) => item.id);
  const questionIds = (links ?? [])
    .map((item) => item.question_id)
    .filter(Boolean) as string[];

  if (linkIds.length) {
    await supabase
      .from("user_answers")
      .delete()
      .eq("user_id", userId)
      .in("simulation_question_id", linkIds);
  }

  await supabase
    .from("simulation_questions")
    .delete()
    .eq("simulation_id", simulationId);

  await supabase
    .from("simulations")
    .delete()
    .eq("id", simulationId)
    .eq("user_id", userId);

  if (questionIds.length) {
    await supabase
      .from("questions")
      .delete()
      .eq("created_by", userId)
      .in("id", questionIds);
  }

  await supabase
    .from("user_performance")
    .delete()
    .eq("user_id", userId);

  const { data: remainingAnswers } = await supabase
    .from("user_answers")
    .select("simulation_question_id, correct")
    .eq("user_id", userId);

  const remainingLinkIds = (remainingAnswers ?? []).map(
    (answer) => answer.simulation_question_id
  );

  if (remainingLinkIds.length) {
    const { data: remainingLinks } = await supabase
      .from("simulation_questions")
      .select("id, question_id")
      .in("id", remainingLinkIds);

    const remainingQuestionIds = (remainingLinks ?? [])
      .map((item) => item.question_id)
      .filter(Boolean) as string[];

    if (remainingQuestionIds.length) {
      const { data: remainingQuestions } = await supabase
        .from("questions")
        .select("id, subject, topic, subtopic")
        .in("id", remainingQuestionIds);

      const linkToQuestion = new Map(
        (remainingLinks ?? []).map((item) => [item.id, item.question_id])
      );
      const questionMap = new Map(
        (remainingQuestions ?? []).map((question) => [question.id, question])
      );

      const groups = new Map<
        string,
        {
          subject: string;
          topic: string;
          subtopic: string;
          total: number;
          correct: number;
        }
      >();

      for (const answer of remainingAnswers ?? []) {
        const questionId = linkToQuestion.get(answer.simulation_question_id);
        if (!questionId) continue;
        const question = questionMap.get(questionId);
        if (!question) continue;

        const subject = question.subject || "Não identificado";
        const topic = question.topic || "Geral";
        const subtopic = question.subtopic || "Geral";
        const key = `${subject}||${topic}||${subtopic}`;

        const current = groups.get(key) ?? {
          subject,
          topic,
          subtopic,
          total: 0,
          correct: 0,
        };

        current.total += 1;
        if (answer.correct) current.correct += 1;
        groups.set(key, current);
      }

      if (groups.size) {
        await supabase.from("user_performance").insert(
          Array.from(groups.values()).map((group) => ({
            user_id: userId,
            subject: group.subject,
            topic: group.topic,
            subtopic: group.subtopic,
            total_answers: group.total,
            correct_answers: group.correct,
            wrong_answers: group.total - group.correct,
            accuracy: Number(((group.correct / group.total) * 100).toFixed(2)),
            last_answered_at: new Date().toISOString(),
          }))
        );
      }
    }
  }

  revalidatePath("/simulados");
  revalidatePath("/desempenho");
  redirect("/simulados?deleted=1");
}
