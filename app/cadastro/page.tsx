import Link from "next/link";
import { signup } from "./actions";

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
            Prova IA
          </p>
          <h1 className="mt-3 text-3xl font-bold">Criar conta</h1>
          <p className="mt-2 text-sm text-slate-400">
            Comece a estudar com simulados personalizados pelo seu edital.
          </p>

          {params.error && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {params.error}
            </div>
          )}

          <form action={signup} className="mt-6 space-y-4">
            <div>
              <label htmlFor="full_name" className="mb-2 block text-sm font-medium">
                Nome completo
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                autoComplete="name"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-violet-500"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-violet-500"
                placeholder="voce@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-violet-500"
                placeholder="Mínimo de 6 caracteres"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold transition hover:bg-violet-500"
            >
              Criar conta
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Já possui conta?{" "}
            <Link href="/login" className="font-semibold text-violet-400 hover:text-violet-300">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
