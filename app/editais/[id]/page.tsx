import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { analyzeNotice } from "./actions";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string; success?: string }>;

function statusLabel(status: string) {
  if (status === "pending") return "Aguardando análise";
  if (status === "processing") return "Analisando";
  if (status === "completed") return "Análise concluída";
  if (status === "failed") return "Falha na análise";
  return status;
}

function statusClass(status: string) {
  if (status === "completed") return "bg-emerald-400/10 text-emerald-300";
  if (status === "failed") return "bg-red-400/10 text-red-300";
  if (status === "processing") return "bg-blue-400/10 text-blue-300";
  return "bg-amber-400/10 text-amber-300";
}

export default async function EditalDetalhesPage({
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

  const { data: notice, error: noticeError } = await supabase
    .from("notices")
    .select("id, title, file_path, analysis_status, exam_date, uploaded_at")
    .eq("id", id)
    .maybeSingle();

  if (noticeError || !notice) {
    notFound();
  }

  const [{ data: topics }, { data: analysis }] = await Promise.all([
    supabase
      .from("notice_topics")
      .select("id, category, subject, subtopic, expected_questions, weight, source_reference")
      .eq("notice_id", id)
      .order("category", { ascending: true })
      .order("subject", { ascending: true }),
    supabase
      .from("notice_analyses")
      .select(
        "board_name, organization_name, city, state, position_name, exam_date, total_questions, summary, confidence"
      )
      .eq("notice_id", id)
      .maybeSingle(),
  ]);

  const { data: signedUrlData } = notice.file_path
    ? await supabase.storage.from("editais").createSignedUrl(notice.file_path, 300)
    : { data: null };

  const examDate = analysis?.exam_date || notice.exam_date;
  const isProcessing = notice.analysis_status === "processing";

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
        {query.error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {query.error}
          </div>
        )}

        {query.success === "1" && (
          <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            Análise concluída com sucesso.
          </div>
        )}

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

            <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(
              notice.analysis_status
            )}`}>
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

            <form action={analyzeNotice}>
              <input type="hidden" name="notice_id" value={notice.id} />
              <button
                type="submit"
                disabled={isProcessing}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isProcessing
                  ? "Analisando..."
                  : notice.analysis_status === "completed"
                    ? "Analisar novamente"
                    : "Analisar com IA"}
              </button>
            </form>

            {notice.analysis_status === "completed" && (
              <Link
                href={`/simulados/novo?notice=${notice.id}`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/15"
              >
                Gerar simulado
              </Link>
            )}
          </div>
        </div>

        {analysis?.summary && (
          <div className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-400/5 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-violet-300">
              Resumo da IA
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
              {analysis.summary}
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Banca</p>
            <p className="mt-2 break-words text-lg font-semibold text-slate-200">
              {analysis?.board_name || "Aguardando análise"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cargo</p>
            <p className="mt-2 break-words text-lg font-semibold text-slate-200">
              {analysis?.position_name || "Aguardando análise"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Local</p>
            <p className="mt-2 break-words text-lg font-semibold text-slate-200">
              {analysis?.city
                ? `${analysis.city}${analysis.state ? `/${analysis.state}` : ""}`
                : "Aguardando análise"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Data da prova</p>
            <p className="mt-2 text-lg font-semibold text-slate-200">
              {examDate
                ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
                    new Date(`${examDate}T00:00:00Z`)
                  )
                : "Não identificada"}
            </p>
          </div>
        </div>

        {(analysis?.organization_name || analysis?.total_questions) && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Órgão / Prefeitura
              </p>
              <p className="mt-2 font-semibold text-slate-200">
                {analysis?.organization_name || "Não identificado"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Total de questões
              </p>
              <p className="mt-2 font-semibold text-slate-200">
                {analysis?.total_questions || "Não identificado"}
              </p>
            </div>
          </div>
        )}

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
              Clique em <strong>Analisar com IA</strong> para extrair banca, cargo,
              matérias, legislação, pesos e conhecimentos municipais ou estaduais
              diretamente do PDF.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="px-3 py-3 font-medium">Categoria</th>
                    <th className="px-3 py-3 font-medium">Disciplina</th>
                    <th className="px-3 py-3 font-medium">Subassunto</th>
                    <th className="px-3 py-3 font-medium">Questões</th>
                    <th className="px-3 py-3 font-medium">Peso</th>
                    <th className="px-3 py-3 font-medium">Referência</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((topic) => (
                    <tr key={topic.id} className="border-b border-white/5 align-top">
                      <td className="px-3 py-3 text-slate-300">{topic.category}</td>
                      <td className="px-3 py-3 font-medium text-white">{topic.subject}</td>
                      <td className="px-3 py-3 text-slate-400">{topic.subtopic || "—"}</td>
                      <td className="px-3 py-3 text-slate-300">
                        {topic.expected_questions ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-300">{topic.weight ?? "—"}</td>
                      <td className="max-w-xs px-3 py-3 text-slate-500">
                        {topic.source_reference || "—"}
                      </td>
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
