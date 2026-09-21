import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SimuladosPage() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();

  if (error || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const { data: simulations } = await supabase
    .from("simulations")
    .select("id, title, question_count, status, score, correct_answers, wrong_answers, created_at, completed_at")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <main className="min-h-dvh bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-400 sm:text-xs">Prova IA</p>
            <h1 className="mt-1 text-lg font-bold sm:text-xl">Simulados</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard" className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/10">
              Dashboard
            </Link>
            <Link href="/simulados/novo" className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold hover:bg-violet-500">
              Novo simulado
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/15 to-transparent p-5 sm:rounded-3xl sm:p-8">
          <p className="text-sm text-violet-300">Treino personalizado</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Seus simulados</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Nesta fase de teste, as questões são mockadas para validar geração, correção, histórico e desempenho.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {!simulations?.length ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400 md:col-span-2 xl:col-span-3">
              Você ainda não criou nenhum simulado.
            </div>
          ) : (
            simulations.map((simulation) => (
              <Link
                key={simulation.id}
                href={`/simulados/${simulation.id}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{simulation.title}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    simulation.status === "completed"
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-amber-400/10 text-amber-300"
                  }`}>
                    {simulation.status === "completed" ? "Concluído" : "Em andamento"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-900/60 p-3">
                    <p className="text-xs text-slate-500">Questões</p>
                    <p className="mt-1 font-semibold">{simulation.question_count}</p>
                  </div>
                  <div className="rounded-xl bg-slate-900/60 p-3">
                    <p className="text-xs text-slate-500">Nota</p>
                    <p className="mt-1 font-semibold">
                      {simulation.status === "completed" ? `${simulation.score ?? 0}%` : "—"}
                    </p>
                  </div>
                </div>

                {simulation.status === "completed" && (
                  <p className="mt-4 text-sm text-slate-400">
                    {simulation.correct_answers} acertos · {simulation.wrong_answers} erros
                  </p>
                )}

                <p className="mt-4 text-sm font-semibold text-violet-300">Abrir →</p>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
