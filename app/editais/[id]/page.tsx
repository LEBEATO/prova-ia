import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

function statusLabel(status: string) {
  if (status === "pending") return "Aguardando análise";
  if (status === "processing") return "Analisando";
  if (status === "completed") return "Análise concluída";
  if (status === "failed") return "Falha na análise";
  return status;
}

export default async function EditalDetalhesPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const { data: notice, error: noticeError } = await supabase
    .from("notices")
    .select(
      "id, title, file_path, analysis_status, exam_date, uploaded_at, public_exam_id, position_id"
    )
    .eq("id", id)
    .maybeSingle();

  if (noticeError || !notice) {
    notFound();
  }

  const { data: topics } = await supabase
    .from("notice_topics")
    .select("id, category, subject, subtopic, expected_questions, weight, source_reference")
    .eq("notice_id", id)
    .order("category", { ascending: true })
    .order("subject", { ascending: true });

  const { data: signedUrlData } = notice.file_path
    ? await supabase.storage.from("editais").createSignedUrl(notice.file_path, 300)
    : { data: null };

  const hasAnalysis = (topics?.length ?? 0) > 0 || notice.analysis_status === "completed";

  return (
    <main className="min-h-dvh bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-400 sm:text-xs">
              Prova IA
            </p>
            <h1 className="mt-1 truncate text-lg font-bold sm:text-xl">
              Detalhes do edital
            </h1>
          </div>

          <Link
            href="/editais"
            className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/10 sm:px-4"
          >
            Voltar
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/15 to-transparent p-5 sm:rounded-3xl sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-violet-300">Edital enviado</p>
              <h2 className="mt-2 break-words text-2xl font-bold sm:text-3xl">
                {notice.title}
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                Enviado em{" "}
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(notice.uploaded_at))}
              </p>
            </div>

            <span className="w-fit rounded-full bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
              {statusLabel(notice.analysis_status)}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {signedUrlData?.signedUrl ? (
              <a
                href={signedUrlData.signedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
              >
                Abrir PDF
              </a>
            ) : null}

            <button
              type="button"
              disabled
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600/50 px-4 py-2 text-sm font-semibold text-white/80"
              title="A análise por IA será conectada no próximo passo"
            >
              Analisar com IA
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Banca</p>
            <p className="mt-2 text-lg font-semibold text-slate-200">
              {hasAnalysis ? "Será exibida após a análise" : "Aguardando análise"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cargo</p>
            <p className="mt-2 text-lg font-semibold text-slate-200">
              {hasAnalysis ? "Será exibido após a análise" : "Aguardando análise"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Data da prova</p>
            <p className="mt-2 text-lg font-semibold text-slate-200">
              {notice.exam_date
                ? new Intl.DateTimeFormat("pt-BR").format(new Date(notice.exam_date))
                : "Não identificada"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-violet-300">Matriz do edital</p>
              <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                Conteúdos identificados
              </h2>
            </div>
            <span className="text-sm text-slate-500">
              {topics?.length ?? 0} tópico(s)
            </span>
          </div>

          {!topics?.length ? (
            <div className="mt-5 rounded-xl border border-dashed border-white/10 p-5 text-sm leading-6 text-slate-400">
              A IA ainda não analisou este edital. No próximo passo vamos conectar a
              leitura automática do PDF e preencher banca, cargo, matérias, legislação,
              pesos e conteúdos municipais ou estaduais.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="px-3 py-3 font-medium">Categoria</th>
                    <th className="px-3 py-3 font-medium">Disciplina</th>
                    <th className="px-3 py-3 font-medium">Subassunto</th>
                    <th className="px-3 py-3 font-medium">Questões</th>
                    <th className="px-3 py-3 font-medium">Peso</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((topic) => (
                    <tr key={topic.id} className="border-b border-white/5">
                      <td className="px-3 py-3 text-slate-300">{topic.category}</td>
                      <td className="px-3 py-3 font-medium text-white">{topic.subject}</td>
                      <td className="px-3 py-3 text-slate-400">{topic.subtopic || "—"}</td>
                      <td className="px-3 py-3 text-slate-300">
                        {topic.expected_questions ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-300">{topic.weight ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
