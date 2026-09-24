import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createSimulation } from "../actions";
import GenerateSimulationButton from "@/components/simulations/GenerateSimulationButton";

type SearchParams = Promise<{ error?: string; notice?: string }>;

export default async function NovoSimuladoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();

  if (error || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const { data: notices } = await supabase
    .from("notices")
    .select("id, title, analysis_status, uploaded_at")
    .eq("analysis_status", "completed")
    .order("uploaded_at", { ascending: false });

  return (
    <main className="min-h-dvh bg-slate-950 text-white">
      <header className="border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-400">Prova IA</p>
            <h1 className="mt-1 text-xl font-bold">Novo simulado</h1>
          </div>
          <Link href="/simulados" className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/10">
            Voltar
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:rounded-3xl sm:p-8">
          <p className="text-sm text-violet-300">Gerador de prova</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Escolha o edital e a quantidade</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            O modo teste usa a matriz do edital já analisado para distribuir as questões.
          </p>

          {query.error && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {query.error}
            </div>
          )}

          {!notices?.length ? (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-400">
              Nenhum edital analisado disponível. Analise um edital primeiro.
            </div>
          ) : (
            <form action={createSimulation} className="mt-6 space-y-5">
              <div>
                <label htmlFor="notice_id" className="mb-2 block text-sm font-medium">Edital</label>
                <select
                  id="notice_id"
                  name="notice_id"
                  required
                  defaultValue={query.notice ?? ""}
                  className="min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-base outline-none focus:border-violet-500 sm:text-sm"
                >
                  <option value="">Selecione um edital</option>
                  {notices.map((notice) => (
                    <option key={notice.id} value={notice.id}>{notice.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium">Nível do simulado</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    ["adaptive", "Adaptativo", "Aumenta conforme sua evolução"],
                    ["beginner", "Iniciante", "Mais questões fáceis"],
                    ["intermediate", "Intermediário", "Equilíbrio entre níveis"],
                    ["advanced", "Avançado", "Maior carga de questões difíceis"],
                    ["board", "Nível banca", "Mais próximo de uma prova exigente"],
                  ].map(([value, title, description]) => (
                    <label key={value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="difficulty_mode"
                        value={value}
                        defaultChecked={value === "adaptive"}
                        className="peer sr-only"
                      />
                      <span className="block min-h-28 rounded-xl border border-white/10 bg-slate-900 p-4 transition peer-checked:border-violet-500 peer-checked:bg-violet-500/10">
                        <span className="block font-semibold peer-checked:text-violet-300">{title}</span>
                        <span className="mt-2 block text-xs leading-5 text-slate-500">{description}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  No modo Adaptativo, cada novo simulado usa seu histórico de acertos para aumentar gradualmente a dificuldade.
                </p>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium">Quantidade de questões</p>
                <div className="grid grid-cols-3 gap-3">
                  {[10, 20, 30].map((count) => (
                    <label key={count} className="cursor-pointer">
                      <input
                        type="radio"
                        name="question_count"
                        value={count}
                        defaultChecked={count === 30}
                        className="peer sr-only"
                      />
                      <span className="flex min-h-14 items-center justify-center rounded-xl border border-white/10 bg-slate-900 font-semibold transition peer-checked:border-violet-500 peer-checked:bg-violet-500/10 peer-checked:text-violet-300">
                        {count}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <GenerateSimulationButton />
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
