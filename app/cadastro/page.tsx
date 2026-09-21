import Link from "next/link";
import { signup } from "./actions";

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md items-center sm:min-h-[calc(100dvh-5rem)]">
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur sm:rounded-3xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-400 sm:text-sm">
            Prova IA
          </p>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Criar conta</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
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
                className="min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-base outline-none transition focus:border-violet-500 sm:text-sm"
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
                className="min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-base outline-none transition focus:border-violet-500 sm:text-sm"
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
                className="min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-base outline-none transition focus:border-violet-500 sm:text-sm"
                placeholder="Mínimo de 6 caracteres"
              />
            </div>

            <button
              type="submit"
              className="min-h-12 w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Criar conta
            </button>
          </form>

          <p className="mt-6 text-center text-sm leading-6 text-slate-400">
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
