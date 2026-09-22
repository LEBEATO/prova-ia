import Link from "next/link";

const features = [
  {
    title: "Edital inteligente",
    description:
      "Envie o PDF do concurso e organize banca, cargo, conteúdos, legislação e conhecimentos locais.",
    icon: "document",
  },
  {
    title: "Simulados personalizados",
    description:
      "Monte provas de 10, 20 ou 30 questões alinhadas ao conteúdo do seu edital.",
    icon: "exam",
  },
  {
    title: "Desempenho por assunto",
    description:
      "Acompanhe acertos, erros recorrentes e os temas que mais precisam de revisão.",
    icon: "chart",
  },
];

const steps = [
  "Envie seu edital",
  "Analise os conteúdos",
  "Gere seu simulado",
  "Descubra onde melhorar",
];

export default function Home() {
  return (
    <main className="min-h-dvh overflow-hidden bg-slate-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-violet-400 sm:text-xs">
              Prova IA
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-300 sm:text-base">
              Prepare-se com estratégia
            </p>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/cadastro"
              className="hidden rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 sm:inline-flex"
            >
              Criar conta
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5 hover:bg-violet-500"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-8rem] h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl sm:h-96 sm:w-96" />
          <div className="absolute right-[-8rem] top-40 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl sm:h-96 sm:w-96" />
          <div className="absolute bottom-0 left-[-6rem] h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl sm:h-96 sm:w-96" />
        </div>

        <div className="mx-auto grid min-h-[calc(100dvh-77px)] w-full max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold text-violet-200 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              Plataforma de preparação para concursos
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              Estude com foco no
              <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                edital que realmente importa.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
              O Prova IA transforma seu edital em uma trilha de estudo mais prática:
              organize os conteúdos, gere simulados personalizados e acompanhe onde
              você mais precisa evoluir.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-6 py-3 font-semibold shadow-xl shadow-violet-950/40 transition hover:-translate-y-0.5 hover:bg-violet-500"
              >
                Entrar na plataforma
              </Link>

              <Link
                href="/cadastro"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Criar conta gratuita
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur sm:p-4"
                >
                  <p className="text-xs font-semibold text-violet-300">
                    0{index + 1}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-5 text-slate-300">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-violet-500/30 via-transparent to-fuchsia-500/20 blur-2xl" />

            <div className="relative rounded-[2rem] border border-white/10 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                    Painel de estudo
                  </p>
                  <h2 className="mt-1 text-lg font-bold sm:text-xl">
                    Seu próximo concurso
                  </h2>
                </div>

                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Em preparação
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-transparent p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Edital</p>
                    <p className="mt-1 text-lg font-bold">
                      Professor I — Prefeitura Municipal
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-200">
                    30 questões
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-950/60 p-3">
                    <p className="text-xs text-slate-500">Acertos</p>
                    <p className="mt-1 text-xl font-bold text-emerald-300">24</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/60 p-3">
                    <p className="text-xs text-slate-500">Erros</p>
                    <p className="mt-1 text-xl font-bold text-red-300">6</p>
                  </div>
                  <div className="rounded-xl bg-slate-950/60 p-3">
                    <p className="text-xs text-slate-500">Aproveitamento</p>
                    <p className="mt-1 text-xl font-bold">80%</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  ["Língua Portuguesa", "82%"],
                  ["Conhecimentos Pedagógicos", "74%"],
                  ["Legislação Educacional", "68%"],
                  ["Conhecimentos Locais", "55%"],
                ].map(([subject, score]) => (
                  <div
                    key={subject}
                    className="rounded-xl border border-white/10 bg-slate-950/50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-300">
                        {subject}
                      </p>
                      <span className="text-sm font-bold text-violet-300">
                        {score}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                        style={{ width: score }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-amber-400/10 bg-amber-400/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                  Ponto de atenção
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Conhecimentos Locais é o assunto com menor índice de acerto e
                  deve receber mais revisão.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-slate-950/70 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-violet-300">
              Tudo em um só fluxo
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Do edital ao diagnóstico de desempenho.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.06] sm:p-6"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300 shadow-lg shadow-violet-950/20">
                  {feature.icon === "document" && (
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M7 3.75h7l3 3V20.25H7z" />
                      <path d="M14 3.75v3h3" />
                      <path d="M9.5 11h5M9.5 14h5M9.5 17h3.5" />
                    </svg>
                  )}
                  {feature.icon === "exam" && (
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="4" y="4" width="16" height="16" rx="3" />
                      <path d="M8 9h8M8 13h5M8 17h3" />
                      <path d="m15 16 1.2 1.2L19 14.4" />
                    </svg>
                  )}
                  {feature.icon === "chart" && (
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M5 19V9M10 19V5M15 19v-7M20 19V8" />
                      <path d="M4 19.25h17" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-slate-600 sm:px-6">
        Prova IA — preparação inteligente para concursos.
      </footer>
    </main>
  );
}
