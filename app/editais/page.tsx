import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uploadNotice } from "./actions";

type SearchParams = Promise<{
  error?: string;
  success?: string;
}>;

export default async function EditaisPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const { data: notices } = await supabase
    .from("notices")
    .select("id, title, analysis_status, uploaded_at")
    .order("uploaded_at", { ascending: false })
    .limit(20);

  return (
    <main className="min-h-dvh bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-400 sm:text-xs">
              Prova IA
            </p>
            <h1 className="mt-1 truncate text-lg font-bold sm:text-xl">
              Meus editais
            </h1>
          </div>

          <Link
            href="/dashboard"
            className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/10 sm:px-4"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] lg:px-8">
        <div className="min-w-0">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/15 to-transparent p-5 sm:rounded-3xl sm:p-8">
            <p className="text-sm font-medium text-violet-300">
              Análise de edital
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Envie o PDF do seu concurso
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              O Prova IA usará o edital para identificar banca, cargo,
              disciplinas, pesos, legislação e conteúdos específicos do
              município ou estado.
            </p>

            {params.error && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {params.error}
              </div>
            )}

            {params.success && (
              <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                {params.success}
              </div>
            )}

            <form action={uploadNotice} className="mt-6 space-y-5">
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium">
                  Nome do edital
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  maxLength={140}
                  className="min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-base outline-none transition focus:border-violet-500 sm:text-sm"
                  placeholder="Ex.: Prefeitura de Campinas - Professor II"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Opcional. Se deixar vazio, usaremos o nome do arquivo.
                </p>
              </div>

              <div>
                <label htmlFor="file" className="mb-2 block text-sm font-medium">
                  Arquivo PDF
                </label>
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  className="block min-h-12 w-full cursor-pointer rounded-xl border border-dashed border-white/15 bg-slate-900 px-3 py-3 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-3 file:py-2 file:font-semibold file:text-white hover:file:bg-violet-500"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Apenas PDF, com até 20 MB.
                </p>
              </div>

              <button
                type="submit"
                className="min-h-12 w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:w-auto sm:min-w-48"
              >
                Enviar edital
              </button>
            </form>
          </div>
        </div>

        <aside className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-violet-300">Histórico</p>
              <h2 className="mt-1 text-xl font-bold">Editais enviados</h2>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
              {notices?.length ?? 0}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {!notices?.length ? (
              <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm leading-6 text-slate-400">
                Você ainda não enviou nenhum edital.
              </div>
            ) : (
              notices.map((notice) => (
                <Link
                  key={notice.id}
                  href={`/editais/${notice.id}`}
                  className="block rounded-xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-violet-400/40 hover:bg-slate-900"
                >
                  <p className="break-words font-semibold">{notice.title}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-amber-300">
                      {notice.analysis_status === "pending"
                        ? "Aguardando análise"
                        : notice.analysis_status}
                    </span>
                    <span className="text-slate-500">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(notice.uploaded_at))}
                    </span>
                    <span className="ml-auto font-semibold text-violet-300">
                      Abrir →
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
