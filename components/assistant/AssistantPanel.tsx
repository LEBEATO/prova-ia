"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSimulation } from "@/app/simulados/actions";

type NoticeContext = {
  id: string;
  title: string;
  analysis_status: string;
  board_name: string | null;
};

type SimulationContext = {
  id: string;
  title: string;
  question_count: number;
};

type PerformanceContext = {
  subject: string;
  accuracy: number;
} | null;

type AssistantPanelProps = {
  userName: string;
  notices: NoticeContext[];
  inProgress: SimulationContext | null;
  latestScore: number | null;
  weakest: PerformanceContext;
};

type Message = {
  role: "assistant" | "user";
  text: string;
};

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || "professor";
}

export default function AssistantPanel({
  userName,
  notices,
  inProgress,
  latestScore,
  weakest,
}: AssistantPanelProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [memoryLoaded, setMemoryLoaded] = useState(false);
  const [awaitingCount, setAwaitingCount] = useState(false);
  const [awaitingNotice, setAwaitingNotice] = useState(false);
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [isPending, startTransition] = useTransition();

  const formRef = useRef<HTMLFormElement>(null);
  const noticeRef = useRef<HTMLInputElement>(null);
  const countRef = useRef<HTMLInputElement>(null);
  const modeRef = useRef<HTMLInputElement>(null);

  const analyzedNotices = useMemo(
    () => notices.filter((notice) => notice.analysis_status === "completed"),
    [notices]
  );

  const preferredNotice = analyzedNotices[0] ?? null;
  const selectedNotice =
    analyzedNotices.find((notice) => notice.id === selectedNoticeId) ??
    preferredNotice;
  const name = firstName(userName);

  function speak(text: string) {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.98;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function assistantSay(text: string, shouldSpeak = true) {
    setMessages((current) => [...current, { role: "assistant", text }]);
    if (shouldSpeak) speak(text);
  }

  useEffect(() => {
    const storageKey = "provaia-assistant-session";
    try {
      const saved = window.sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { messages?: Message[] };
        if (Array.isArray(parsed.messages) && parsed.messages.length) {
          setMessages(parsed.messages);
          setMemoryLoaded(true);
          return;
        }
      }
    } catch {
      // Se a memória local falhar, seguimos com uma nova conversa.
    }

    let greeting = `Olá, ${name}. Que bom ter você por aqui. `;

    if (inProgress) {
      greeting += `Você tem um simulado em andamento com ${inProgress.question_count} questões. Posso continuar exatamente de onde você parou, ou preparar um novo para você.`;
    } else if (preferredNotice) {
      const board = preferredNotice.board_name
        ? ` da banca ${preferredNotice.board_name}`
        : "";
      greeting += `Já encontrei o edital “${preferredNotice.title}”${board}. Posso criar um novo simulado, conversar sobre seu desempenho ou abrir seus editais.`;
    } else {
      greeting +=
        "Ainda não encontrei um edital analisado na sua conta. Se quiser, eu posso te levar para enviar seu PDF e começar a preparação.";
    }

    setMessages([{ role: "assistant", text: greeting }]);
    setMemoryLoaded(true);

    const timer = window.setTimeout(() => speak(greeting), 450);
    return () => window.clearTimeout(timer);
    // A saudação deve acontecer apenas na entrada do painel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!memoryLoaded || typeof window === "undefined") return;

    try {
      window.sessionStorage.setItem(
        "provaia-assistant-session",
        JSON.stringify({
          messages: messages.slice(-30),
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Memória de sessão é um aprimoramento; a conversa continua sem ela.
    }
  }, [messages, memoryLoaded]);

  function openAfterMessage(text: string, href: string) {
    assistantSay(text);
    window.setTimeout(() => router.push(href), 800);
  }

  function askQuestionCount(noticeId?: string) {
    const notice =
      analyzedNotices.find((item) => item.id === noticeId) ?? selectedNotice;

    if (!notice) return;

    setSelectedNoticeId(notice.id);
    setAwaitingNotice(false);
    setAwaitingCount(true);

    const board = notice.board_name ? ` da banca ${notice.board_name}` : "";

    assistantSay(
      `Perfeito. Vou usar o edital “${notice.title}”${board}. Você quer 10, 20 ou 30 questões? Vou começar no modo adaptativo, usando seu histórico para ajustar a dificuldade.`
    );
  }

  function beginNewSimulation() {
    if (!preferredNotice) {
      openAfterMessage(
        "Para montar um simulado fiel ao concurso, primeiro preciso de um edital analisado. Vou abrir seus editais para você.",
        "/editais"
      );
      return;
    }

    if (analyzedNotices.length > 1) {
      setAwaitingNotice(true);
      const choices = analyzedNotices
        .slice(0, 4)
        .map(
          (notice, index) =>
            `${index + 1}. ${notice.title}${notice.board_name ? ` — ${notice.board_name}` : ""}`
        )
        .join(" ");

      assistantSay(
        `Você tem mais de um edital analisado. Qual deles quer usar? ${choices}`
      );
      return;
    }

    askQuestionCount(preferredNotice.id);
  }

  function generateSimulation(count: number) {
    if (!selectedNotice || !formRef.current || !noticeRef.current || !countRef.current || !modeRef.current) {
      return;
    }

    noticeRef.current.value = selectedNotice.id;
    countRef.current.value = String(count);
    modeRef.current.value = "adaptive";
    setAwaitingCount(false);

    assistantSay(
      `Certo, ${name}. Vou preparar ${count} questões no modo adaptativo. Assim que estiver pronto, já abro o simulado para você.`
    );

    window.setTimeout(() => {
      startTransition(() => {
        formRef.current?.requestSubmit();
      });
    }, 500);
  }

  function explainPerformance() {
    if (latestScore === null && !weakest) {
      assistantSay(
        "Você ainda não concluiu simulados suficientes para eu montar um diagnóstico. Quando finalizar o primeiro, eu vou comparar seus acertos por assunto e te mostrar onde vale concentrar o estudo."
      );
      return;
    }

    const scoreText =
      latestScore !== null
        ? `No seu último simulado, você ficou com ${latestScore}% de aproveitamento. `
        : "";

    const weakestText = weakest
      ? `Hoje, o ponto que merece mais atenção é ${weakest.subject}, com ${weakest.accuracy}% de acerto acumulado. Posso montar um treino focado nisso depois.`
      : "Seu desempenho está sendo acompanhado por assunto.";

    assistantSay(scoreText + weakestText);
  }

  function handleMessage(raw: string) {
    const text = raw.trim();
    if (!text) return;

    setMessages((current) => [...current, { role: "user", text }]);
    setInput("");

    const normalized = text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (awaitingNotice) {
      const numericChoice = Number(normalized.match(/\b([1-4])\b/)?.[1] ?? 0);
      const byNumber = numericChoice
        ? analyzedNotices[numericChoice - 1]
        : null;

      const byText = analyzedNotices.find((notice) => {
        const title = notice.title
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        const board = (notice.board_name ?? "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        return (
          (title.length > 3 && normalized.includes(title)) ||
          (board.length > 2 && normalized.includes(board))
        );
      });

      const chosen = byNumber ?? byText;
      if (chosen) {
        askQuestionCount(chosen.id);
        return;
      }

      assistantSay(
        "Não consegui identificar qual edital você escolheu. Pode dizer o número da opção, o nome do edital ou o nome da banca?"
      );
      return;
    }

    if (awaitingCount) {
      const count = normalized.match(/\b(10|20|30)\b/)?.[1];
      if (count) {
        generateSimulation(Number(count));
        return;
      }

      assistantSay("Pode me dizer apenas 10, 20 ou 30 questões. Qual quantidade você prefere?");
      return;
    }

    if (
      normalized.includes("continuar") ||
      normalized.includes("retomar") ||
      normalized.includes("onde parei")
    ) {
      if (inProgress) {
        openAfterMessage(
          `Claro. Vou abrir seu simulado em andamento com ${inProgress.question_count} questões.`,
          `/simulados/${inProgress.id}`
        );
      } else {
        assistantSay(
          "Não encontrei nenhum simulado em andamento agora. Se quiser, eu posso criar um novo para você."
        );
      }
      return;
    }

    if (
      normalized.includes("novo simulado") ||
      normalized.includes("fazer simulado") ||
      normalized.includes("criar simulado") ||
      normalized === "simulado"
    ) {
      const requestedCount = normalized.match(/\b(10|20|30)\b/)?.[1];

      if (requestedCount && analyzedNotices.length === 1) {
        setSelectedNoticeId(analyzedNotices[0].id);
        window.setTimeout(() => generateSimulation(Number(requestedCount)), 0);
        return;
      }

      beginNewSimulation();
      return;
    }

    if (
      normalized.includes("desempenho") ||
      normalized.includes("resultado") ||
      normalized.includes("como fui") ||
      normalized.includes("meus erros")
    ) {
      explainPerformance();
      return;
    }

    if (normalized.includes("abrir desempenho")) {
      openAfterMessage("Vou abrir seu relatório completo.", "/desempenho");
      return;
    }

    if (normalized.includes("edital") || normalized.includes("pdf")) {
      if (preferredNotice) {
        const board = preferredNotice.board_name
          ? ` A banca identificada é ${preferredNotice.board_name}.`
          : "";
        assistantSay(
          `Seu edital mais recente analisado é “${preferredNotice.title}”.${board} Se quiser, posso usar esse edital para montar um simulado agora.`
        );
      } else {
        openAfterMessage(
          "Ainda não há edital analisado. Vou abrir a área de editais para você enviar o PDF.",
          "/editais"
        );
      }
      return;
    }

    if (normalized.includes("banca")) {
      if (preferredNotice?.board_name) {
        assistantSay(
          `No edital “${preferredNotice.title}”, a banca identificada é ${preferredNotice.board_name}.`
        );
      } else {
        assistantSay(
          "Ainda não tenho uma banca identificada em um edital analisado. Podemos analisar um edital primeiro."
        );
      }
      return;
    }

    assistantSay(
      "Entendi. Posso te ajudar a continuar um simulado, criar um novo, consultar seu desempenho ou trabalhar com seus editais. Você também pode falar comigo pelo microfone."
    );
  }

  function startListening() {
    if (typeof window === "undefined") return;

    const SpeechRecognitionConstructor =
      (window as unknown as { webkitSpeechRecognition?: new () => any })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      assistantSay(
        "Seu navegador não disponibilizou reconhecimento de voz aqui. Você pode continuar digitando normalmente."
      );
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) handleMessage(transcript);
    };

    recognition.start();
  }

  const quickActions = [
    ...(inProgress ? ["Continuar meu simulado"] : []),
    "Quero um novo simulado",
    "Como está meu desempenho?",
    preferredNotice ? "Qual é minha banca?" : "Enviar meu edital",
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-white/[0.04] to-fuchsia-500/5 shadow-2xl shadow-violet-950/10">
      <div className="border-b border-white/10 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                Assistente Prova IA
              </p>
            </div>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              Converse comigo para estudar
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Texto, voz e ações do sistema no mesmo lugar.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                try {
                  window.sessionStorage.removeItem("provaia-assistant-session");
                } catch {}
                setMessages([]);
                setMemoryLoaded(false);
                window.location.reload();
              }}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-white/10"
            >
              Nova conversa
            </button>

          <button
            type="button"
            onClick={() => {
              const next = !voiceEnabled;
              setVoiceEnabled(next);
              if (!next && "speechSynthesis" in window) window.speechSynthesis.cancel();
            }}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
          >
            {voiceEnabled ? "🔊 Voz ligada" : "🔇 Voz desligada"}
          </button>
          </div>
        </div>
      </div>

      <div className="max-h-[430px] space-y-4 overflow-y-auto p-5 sm:p-6">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[78%] ${
                message.role === "user"
                  ? "rounded-br-md bg-violet-600 text-white"
                  : "rounded-bl-md border border-white/10 bg-slate-900/80 text-slate-200"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}

        {(isPending || awaitingCount || awaitingNotice) && (
          <p className="text-xs text-violet-300">
            {isPending ? "Preparando seu simulado..." : "Estou aguardando sua escolha."}
          </p>
        )}
      </div>

      <div className="border-t border-white/10 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => handleMessage(action)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-violet-400/30 hover:bg-violet-400/10 hover:text-violet-200"
            >
              {action}
            </button>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleMessage(input);
          }}
          className="flex items-end gap-2"
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="assistant-message" className="sr-only">
              Converse com o Assistente Prova IA
            </label>
            <textarea
              id="assistant-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleMessage(input);
                }
              }}
              rows={1}
              placeholder="Ex.: quero fazer um simulado novo..."
              className="max-h-32 min-h-12 w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-base outline-none transition focus:border-violet-500 sm:text-sm"
            />
          </div>

          <button
            type="button"
            onClick={startListening}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg transition ${
              listening
                ? "border-red-400/40 bg-red-500/15 text-red-300"
                : "border-white/10 bg-white/5 hover:border-violet-400/30 hover:bg-violet-400/10"
            }`}
            aria-label="Falar com o assistente"
            title="Falar"
          >
            {listening ? "●" : "🎙️"}
          </button>

          <button
            type="submit"
            disabled={!input.trim()}
            className="flex h-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 px-4 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>

      <form ref={formRef} action={createSimulation} className="hidden">
        <input ref={noticeRef} type="hidden" name="notice_id" />
        <input ref={countRef} type="hidden" name="question_count" />
        <input ref={modeRef} type="hidden" name="difficulty_mode" />
      </form>
    </section>
  );
}
