import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "./actions";
import AssistantPanel from "@/components/assistant/AssistantPanel";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login");
  }

  const userId = data.claims.sub;

  const [{ data: profile }, { data: notices }, { data: inProgressRows }, { data: latestCompleted }, { data: weakestRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("notices")
      .select("id, title, analysis_status, uploaded_at")
      .eq("user_id", userId)
      .order("uploaded_at", { ascending: false })
      .limit(10),
    supabase
      .from("simulations")
      .select("id, title, question_count, created_at")
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("simulations")
      .select("score, completed_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_performance")
      .select("subject, accuracy")
      .eq("user_id", userId)
      .order("accuracy", { ascending: true })
      .limit(1),
  ]);

  const noticeIds = (notices ?? []).map((notice) => notice.id);
  const { data: analyses } = noticeIds.length
    ? await supabase
        .from("notice_analyses")
        .select("notice_id, board_name")
        .in("notice_id", noticeIds)
    : { data: [] };

  const boardByNotice = new Map(
    (analyses ?? []).map((analysis) => [analysis.notice_id, analysis.board_name])
  );

  const assistantNotices = (notices ?? []).map((notice) => ({
    id: notice.id,
    title: notice.title,
    analysis_status: notice.analysis_status,
    board_name: boardByNotice.get(notice.id) ?? null,
  }));

  const inProgress = inProgressRows?.[0]
    ? {
        id: inProgressRows[0].id,
        title: inProgressRows[0].title,
        question_count: inProgressRows[0].question_count,
      }
    : null;

  const weakest = weakestRows?.[0]
    ? {
        subject: weakestRows[0].subject,
        accuracy: Number(weakestRows[0].accuracy ?? 0),
      }
    : null;

  const cards = [
    {
      title: "Editais",
      description: "Envie e analise o edital do seu concurso.",
      href: "/editais",
      enabled: true,
    },
    {
      title: "Simulados",
      description: "Gere provas alinhadas à banca e ao cargo.",
      href: "/simulados",
      enabled: true,
    },
    {
      title: "Desempenho",
      description: "Veja acertos, erros recorrentes e evolução.",
      href: "/desempenho",
      enabled: true,
    },
  ];

  return (
    <main className="min-h-dvh bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-400 sm:text-xs">
              Prova IA
            </p>
            <h1 className="mt-1 truncate text-lg font-bold sm:text-xl">Dashboard</h1>
          </div>

          <form action={logout} className="shrink-0">
            <button
              type="submit"
              className="min-h-11 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <AssistantPanel
          userName={profile?.full_name || "Professor"}
          notices={assistantNotices}
          inProgress={inProgress}
          latestScore={
            latestCompleted?.score === null || latestCompleted?.score === undefined
              ? null
              : Number(latestCompleted.score)
          }
          weakest={weakest}
        />

        <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-transparent p-5 sm:rounded-3xl sm:p-7">
          <p className="text-sm text-violet-300">Acesso rápido</p>
          <h2 className="mt-1 text-xl font-bold sm:text-2xl">
            Prefere usar os botões?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Você pode conversar com o assistente ou continuar usando o Prova IA do jeito tradicional.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {cards.map((card) =>
            card.enabled ? (
              <Link
                key={card.title}
                href={card.href}
                className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/[0.07] sm:p-6"
              >
                <h3 className="text-base font-semibold sm:text-lg">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {card.description}
                </p>
                <p className="mt-5 text-sm font-semibold text-violet-300">
                  Abrir →
                </p>
              </Link>
            ) : (
              <div
                key={card.title}
                className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-5 opacity-70 sm:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold sm:text-lg">{card.title}</h3>
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-wide text-slate-400">
                    Em breve
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {card.description}
                </p>
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}
