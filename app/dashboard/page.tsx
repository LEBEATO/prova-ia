import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login");
  }

  const userId = data.claims.sub;
  const email = typeof data.claims.email === "string" ? data.claims.email : "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

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
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/15 to-transparent p-5 sm:rounded-3xl sm:p-8">
          <p className="text-sm text-violet-300">Bem-vindo ao Prova IA</p>
          <h2 className="mt-2 break-words text-2xl font-bold sm:text-3xl lg:text-4xl">
            {profile?.full_name || email || "Estudante"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Envie seu edital, acompanhe os simulados e veja sua evolução por assunto.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
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
