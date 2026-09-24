"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSimulation } from "@/app/simulados/actions";
import { pickPreferredFemalePtBrVoice } from "@/lib/voice/female-voice";
import { SiProbot } from "react-icons/si";

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

type Step = "idle" | "notice" | "count";

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || "Professor";
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function AssistantPanel({
  userName,
  notices,
  inProgress,
  latestScore,
  weakest,
}: AssistantPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Pronta para ajudar.");
  const [step, setStep] = useState<Step>("idle");
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpen(true);
      speak(greeting(), true);
    }, 700);

    return () => window.clearTimeout(timer);
    // Saudação automática apenas ao entrar no dashboard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function speak(text: string, listenAfter = false) {
    setStatus(text);

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (listenAfter) window.setTimeout(() => startListening(), 200);
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();
    synth.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 1.1;
    utterance.pitch = 1.06;

    const femaleVoice = pickPreferredFemalePtBrVoice(synth.getVoices());
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onend = () => {
      if (listenAfter) {
        window.setTimeout(() => startListening(), 250);
      }
    };

    synth.speak(utterance);
  }

  function greeting() {
    if (inProgress) {
      return `Olá, ${name}. Você tem um simulado em andamento com ${inProgress.question_count} questões. Quer continuar ou criar outro?`;
    }

    if (preferredNotice) {
      const board = preferredNotice.board_name
        ? ` da banca ${preferredNotice.board_name}`
        : "";
      return `Olá, ${name}. Encontrei seu edital “${preferredNotice.title}”${board}. Como quer estudar hoje?`;
    }

    return `Olá, ${name}. Para começar, envie seu edital em PDF. Depois eu posso montar simulados e acompanhar seu desempenho.`;
  }

  function openAssistant() {
    setOpen(true);
    window.setTimeout(() => speak(greeting(), true), 150);
  }

  function beginSimulation() {
    if (!preferredNotice) {
      speak("Ainda não encontrei um edital analisado. Vou abrir a área de editais.");
      window.setTimeout(() => router.push("/editais"), 650);
      return;
    }

    if (analyzedNotices.length > 1) {
      setStep("notice");
      speak("Você tem mais de um edital analisado. Escolha qual quer usar.", true);
      return;
    }

    setSelectedNoticeId(preferredNotice.id);
    setStep("count");
    speak("Certo. Quantas questões você quer: 10, 20 ou 30?", true);
  }

  function generateSimulation(count: number) {
    if (!selectedNotice || !formRef.current || !noticeRef.current || !countRef.current || !modeRef.current) {
      return;
    }

    noticeRef.current.value = selectedNotice.id;
    countRef.current.value = String(count);
    modeRef.current.value = "adaptive";
    setStep("idle");
    speak(`Perfeito. Vou preparar ${count} questões e abrir o simulado para você.`);

    window.setTimeout(() => {
      startTransition(() => {
        formRef.current?.requestSubmit();
      });
    }, 450);
  }

  function showPerformance() {
    if (latestScore === null && !weakest) {
      speak("Você ainda não concluiu simulados suficientes para eu montar um diagnóstico.");
      return;
    }

    const scoreText =
      latestScore !== null
        ? `Seu último resultado foi ${latestScore}% de aproveitamento. `
        : "";

    const weakestText = weakest
      ? `Seu ponto de maior atenção é ${weakest.subject}, com ${weakest.accuracy}% de acerto.`
      : "";

    speak(scoreText + weakestText);
  }

  function handleIntent(text: string) {
    const value = normalize(text);

    if (step === "notice") {
      const byNumber = Number(value.match(/\b([1-4])\b/)?.[1] ?? 0);
      const chosen =
        (byNumber ? analyzedNotices[byNumber - 1] : null) ??
        analyzedNotices.find((notice) => {
          const title = normalize(notice.title);
          const board = normalize(notice.board_name ?? "");
          return (title && value.includes(title)) || (board && value.includes(board));
        });

      if (chosen) {
        setSelectedNoticeId(chosen.id);
        setStep("count");
        speak(`Vou usar “${chosen.title}”. Você quer 10, 20 ou 30 questões?`, true);
      } else {
        speak("Não consegui identificar o edital. Diga o número, o nome do edital ou a banca.", true);
      }
      return;
    }

    if (step === "count") {
      const count = Number(value.match(/\b(10|20|30)\b/)?.[1] ?? 0);
      if (count) {
        generateSimulation(count);
      } else {
        speak("Escolha 10, 20 ou 30 questões.", true);
      }
      return;
    }

    if (value.includes("continuar") || value.includes("retomar")) {
      if (inProgress) {
        speak("Certo. Vou abrir seu simulado em andamento.");
        window.setTimeout(() => router.push(`/simulados/${inProgress.id}`), 650);
      } else {
        speak("Você não tem simulado em andamento.");
      }
      return;
    }

    if (value.includes("simulado")) {
      beginSimulation();
      return;
    }

    if (value.includes("desempenho") || value.includes("resultado") || value.includes("como fui")) {
      showPerformance();
      return;
    }

    if (value.includes("edital") || value.includes("pdf")) {
      router.push("/editais");
      return;
    }

    speak("Posso abrir um simulado, continuar de onde você parou, mostrar seu desempenho ou trabalhar com seus editais.", true);
  }

  async function startListening() {
    if (typeof window === "undefined") return;

    const Recognition =
      (window as unknown as { SpeechRecognition?: new () => any }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;

    if (!Recognition) {
      setStatus("Reconhecimento de voz não disponível neste navegador.");
      return;
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      setStatus("Libere a permissão do microfone no navegador.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => {
      setListening(true);
      setStatus("Ouvindo...");
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setStatus("Não consegui ouvir. Tente novamente.");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) handleIntent(transcript);
    };
    recognition.start();
  }

  return (
    <section className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-transparent p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            Assistente Prova IA
          </p>
          <h2 className="mt-1 text-lg font-bold sm:text-xl">
            {open ? status : "Converse com a IA"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {open
              ? "A assistente fala e escuta automaticamente."
              : "Toque em IA e converse naturalmente por voz."}
          </p>

          {step === "notice" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {analyzedNotices.slice(0, 4).map((notice, index) => (
                <button
                  key={notice.id}
                  type="button"
                  onClick={() => {
                    setSelectedNoticeId(notice.id);
                    setStep("count");
                    speak(`Vou usar “${notice.title}”. Você quer 10, 20 ou 30 questões?`, true);
                  }}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-violet-400/30 hover:bg-violet-400/10"
                >
                  {index + 1}. {notice.title}
                </button>
              ))}
            </div>
          )}

          {step === "count" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {[10, 20, 30].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => generateSimulation(count)}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-violet-400/30 hover:bg-violet-400/10"
                >
                  {count} questões
                </button>
              ))}
            </div>
          )}

          {isPending && (
            <p className="mt-2 text-xs font-semibold text-violet-300">
              Preparando seu simulado...
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={open ? startListening : openAssistant}
          className={`min-h-11 shrink-0 rounded-xl px-5 py-3 text-sm font-semibold transition ${
            listening
              ? "bg-red-500/20 text-red-300"
              : "bg-violet-600 text-white hover:bg-violet-500"
          }`}
        >
          {listening ? (
            <span className="text-sm">●</span>
          ) : (
            <SiProbot className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      <form ref={formRef} action={createSimulation} className="hidden">
        <input ref={noticeRef} type="hidden" name="notice_id" />
        <input ref={countRef} type="hidden" name="question_count" />
        <input ref={modeRef} type="hidden" name="difficulty_mode" />
      </form>
    </section>
  );
}
