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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-400">
              Prova IA
            </p>
            <h1 className="mt-1 text-xl font-bold">Dashboard</h1>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/15 to-transparent p-8">
          <p className="text-sm text-violet-300">Bem-vindo ao Prova IA</p>
          <h2 className="mt-2 text-3xl font-bold">
            {profile?.full_name || email || "Estudante"}
          </h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Em breve você poderá enviar seu edital, gerar simulados personalizados
            e acompanhar seus erros mais frequentes.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ["Editais", "Envie e analise o edital do seu concurso."],
            ["Simulados", "Gere provas alinhadas à banca e ao cargo."],
            ["Desempenho", "Veja acertos, erros recorrentes e evolução."],
          ].map(([title, description]) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-400">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
