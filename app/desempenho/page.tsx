import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DesempenhoPage() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();

  if (error || !claimsData?.claims?.sub) redirect("/login");

  const userId = claimsData.claims.sub;

  const [{ data: performance }, { data: simulations }] = await Promise.all([
    supabase
      .from("user_performance")
      .select("subject, topic, subtopic, total_answers, correct_answers, wrong_answers, accuracy, last_answered_at")
      .eq("user_id", userId)
      .order("accuracy", { ascending: true }),
    supabase
      .from("simulations")
      .select("score, correct_answers, wrong_answers")
      .eq("status", "completed"),
  ]);

  const totalAnswers = (performance ?? []).reduce((sum, item) => sum + item.total_answers, 0);
  const totalCorrect = (performance ?? []).reduce((sum, item) => sum + item.correct_answers, 0);
  const overallAccuracy = totalAnswers ? Number(((totalCorrect / totalAnswers) * 100).toFixed(1)) : 0;
  const completedCount = simulations?.length ?? 0;

  return (
    <main className="min-h-dvh bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-400">Prova IA</p>
            <h1 className="mt-1 text-xl font-bold">Desempenho</h1>
          </div>
          <Link href="/dashboard" className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/10">
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Acerto geral</p>
            <p className="mt-2 text-3xl font-bold">{overallAccuracy}%</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Questões respondidas</p>
            <p className="mt-2 text-3xl font-bold">{totalAnswers}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Simulados concluídos</p>
            <p className="mt-2 text-3xl font-bold">{completedCount}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p className="text-sm text-violet-300">Diagnóstico</p>
          <h2 className="mt-1 text-xl font-bold sm:text-2xl">Assuntos com mais dificuldade</h2>
          <p className="mt-2 text-sm text-slate-400">
            A lista começa pelos menores índices de acerto para destacar onde o usuário precisa revisar mais.
          </p>

          {!performance?.length ? (
            <div className="mt-5 rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-400">
              Conclua um simulado para gerar seu primeiro relatório.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {performance.map((item) => (
                <div key={`${item.subject}-${item.topic}-${item.subtopic}`} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{item.subject}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.topic} · {item.subtopic}</p>
                    </div>
                    <span className={`text-lg font-bold ${
                      Number(item.accuracy) >= 70 ? "text-emerald-300" : Number(item.accuracy) >= 50 ? "text-amber-300" : "text-red-300"
                    }`}>
                      {item.accuracy}%
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, Number(item.accuracy))}%` }} />
                  </div>

                  <p className="mt-3 text-sm text-slate-400">
                    {item.correct_answers} acertos · {item.wrong_answers} erros · {item.total_answers} respostas
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
