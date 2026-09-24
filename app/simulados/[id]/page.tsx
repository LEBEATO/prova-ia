import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { submitSimulation } from "../actions";
import ReviewAssistant from "@/components/assistant/ReviewAssistant";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string; completed?: string }>;

type Option = { key: string; text: string };

export default async function SimuladoDetalhesPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const userId = claimsData.claims.sub;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  const userName =
    profile?.full_name ||
    (typeof claimsData.claims.email === "string" ? claimsData.claims.email : "Professor");

  const { data: simulation } = await supabase
    .from("simulations")
    .select("id, title, status, question_count, score, correct_answers, wrong_answers, created_at, completed_at, difficulty_mode, difficulty_level, difficulty_profile, sequence_number")
    .eq("id", id)
    .maybeSingle();

  if (!simulation) notFound();

  const { data: links } = await supabase
    .from("simulation_questions")
    .select("id, question_id, position")
    .eq("simulation_id", id)
    .order("position");

  const questionIds = (links ?? [])
    .map((item) => item.question_id)
    .filter(Boolean) as string[];

  const { data: questions } = questionIds.length
    ? await supabase
        .from("questions")
        .select("id, subject, topic, subtopic, difficulty, statement, options, correct_answer, explanation")
        .in("id", questionIds)
    : { data: [] };

  const questionMap = new Map((questions ?? []).map((question) => [question.id, question]));

  const { data: answers } =
    simulation.status === "completed"
      ? await supabase
          .from("user_answers")
          .select("simulation_question_id, selected_answer, correct")
          .eq("simulation_id", id)
          .eq("user_id", userId)
      : { data: [] };

  const answerMap = new Map(
    (answers ?? []).map((answer) => [answer.simulation_question_id, answer])
  );

  const { data: performance } =
    simulation.status === "completed"
      ? await supabase
          .from("user_performance")
          .select("subject, topic, subtopic, total_answers, correct_answers, wrong_answers, accuracy")
          .eq("user_id", userId)
          .order("accuracy", { ascending: true })
          .limit(12)
      : { data: [] };

  const wrongQuestions =
    simulation.status === "completed"
      ? (links ?? [])
          .map((link) => {
            const question = link.question_id ? questionMap.get(link.question_id) : null;
            const answer = answerMap.get(link.id);

            if (!question || answer?.correct) return null;

            return {
              position: link.position,
              subject: question.subject || "Não identificado",
              topic: question.topic || "Geral",
              subtopic: question.subtopic || "Geral",
              statement: question.statement,
              selectedAnswer: answer?.selected_answer ?? null,
              correctAnswer: question.correct_answer,
              explanation: question.explanation || "Revise o conceito central cobrado nesta questão.",
            };
          })
          .filter(Boolean) as Array<{
          position: number;
          subject: string;
          topic: string;
          subtopic: string;
          statement: string;
          selectedAnswer: string | null;
          correctAnswer: string;
          explanation: string;
        }>
      : [];

  return (
    <main className="min-h-dvh bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-400 sm:text-xs">Prova IA</p>
            <h1 className="mt-1 truncate text-lg font-bold sm:text-xl">Simulado</h1>
          </div>
          <Link href="/simulados" className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/10">
            Voltar
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {query.error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {query.error}
          </div>
        )}

        {query.completed === "1" && (
          <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            Simulado corrigido e desempenho atualizado.
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/15 to-transparent p-5 sm:rounded-3xl sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-violet-300">MODO TESTE</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{simulation.title}</h2>
              <p className="mt-2 text-sm text-slate-400">
                {simulation.question_count} questões · {simulation.difficulty_level} · simulado #{simulation.sequence_number}
              </p>
            </div>
            <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
              simulation.status === "completed"
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-amber-400/10 text-amber-300"
            }`}>
              {simulation.status === "completed" ? "Concluído" : "Em andamento"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-900/60 p-3">
              <p className="text-xs text-slate-500">Fáceis</p>
              <p className="mt-1 font-semibold">{Number((simulation.difficulty_profile as Record<string, number> | null)?.easy ?? 0)}%</p>
            </div>
            <div className="rounded-xl bg-slate-900/60 p-3">
              <p className="text-xs text-slate-500">Médias</p>
              <p className="mt-1 font-semibold">{Number((simulation.difficulty_profile as Record<string, number> | null)?.medium ?? 0)}%</p>
            </div>
            <div className="rounded-xl bg-slate-900/60 p-3">
              <p className="text-xs text-slate-500">Difíceis</p>
              <p className="mt-1 font-semibold">{Number((simulation.difficulty_profile as Record<string, number> | null)?.hard ?? 0)}%</p>
            </div>
          </div>

          {simulation.status === "completed" && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-900/60 p-4">
                <p className="text-xs text-slate-500">Nota</p>
                <p className="mt-1 text-xl font-bold">{simulation.score ?? 0}%</p>
              </div>
              <div className="rounded-xl bg-slate-900/60 p-4">
                <p className="text-xs text-slate-500">Acertos</p>
                <p className="mt-1 text-xl font-bold text-emerald-300">{simulation.correct_answers}</p>
              </div>
              <div className="rounded-xl bg-slate-900/60 p-4">
                <p className="text-xs text-slate-500">Erros</p>
                <p className="mt-1 text-xl font-bold text-red-300">{simulation.wrong_answers}</p>
              </div>
            </div>
          )}
        </div>

        <form action={submitSimulation} className="mt-6 space-y-5">
          <input type="hidden" name="simulation_id" value={simulation.id} />

          {(links ?? []).map((link) => {
            const question = link.question_id ? questionMap.get(link.question_id) : null;
            if (!question) return null;

            const options = Array.isArray(question.options)
              ? (question.options as Option[])
              : [];
            const answer = answerMap.get(link.id);

            return (
              <article key={link.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-violet-400/10 px-2.5 py-1 text-violet-300">Questão {link.position}</span>
                  <span className="text-slate-500">{question.subject}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500">{question.difficulty}</span>
                </div>

                <p className="mt-4 text-sm font-medium leading-7 text-slate-100 sm:text-base">
                  {question.statement}
                </p>

                <div className="mt-5 space-y-3">
                  {options.map((option) => {
                    const selected = answer?.selected_answer === option.key;
                    const correctOption =
                      simulation.status === "completed" &&
                      question.correct_answer === option.key;

                    return (
                      <label
                        key={option.key}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                          correctOption
                            ? "border-emerald-500/40 bg-emerald-500/10"
                            : selected && simulation.status === "completed"
                              ? "border-red-500/40 bg-red-500/10"
                              : "border-white/10 bg-slate-900/60 hover:border-violet-400/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`answer_${link.id}`}
                          value={option.key}
                          defaultChecked={selected}
                          disabled={simulation.status === "completed"}
                          className="mt-1"
                        />
                        <span className="text-sm leading-6">
                          <strong className="mr-2">{option.key})</strong>
                          {option.text}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {simulation.status === "completed" && (
                  <div className="mt-5 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm">
                    <p className={answer?.correct ? "text-emerald-300" : "text-red-300"}>
                      {answer?.correct ? "Resposta correta" : `Resposta incorreta · correta: ${question.correct_answer}`}
                    </p>
                    <p className="mt-2 leading-6 text-slate-400">{question.explanation}</p>
                  </div>
                )}
              </article>
            );
          })}

          {simulation.status !== "completed" && (
            <div className="sticky bottom-4 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur">
              <button type="submit" className="min-h-12 w-full rounded-xl bg-violet-600 px-5 py-3 font-semibold hover:bg-violet-500">
                Finalizar e corrigir simulado
              </button>
            </div>
          )}
        </form>

        {simulation.status === "completed" && (
          <ReviewAssistant
            userName={userName}
            score={Number(simulation.score ?? 0)}
            correctAnswers={Number(simulation.correct_answers ?? 0)}
            wrongAnswers={Number(simulation.wrong_answers ?? 0)}
            questions={wrongQuestions}
          />
        )}

        {simulation.status === "completed" && (
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-violet-300">Aprendizado</p>
                <h2 className="mt-1 text-xl font-bold sm:text-2xl">Desempenho por assunto</h2>
              </div>
              <Link href="/desempenho" className="text-sm font-semibold text-violet-300">Ver relatório completo →</Link>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {(performance ?? []).map((item) => (
                <div key={`${item.subject}-${item.topic}-${item.subtopic}`} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{item.subject}</p>
                    <span className={`text-sm font-bold ${
                      Number(item.accuracy) >= 70 ? "text-emerald-300" : Number(item.accuracy) >= 50 ? "text-amber-300" : "text-red-300"
                    }`}>
                      {item.accuracy}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.topic} · {item.subtopic}</p>
                  <p className="mt-3 text-sm text-slate-400">{item.correct_answers} acertos de {item.total_answers}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
