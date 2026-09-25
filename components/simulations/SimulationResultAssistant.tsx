"use client";

import { useEffect, useMemo, useState } from "react";
import { SiProbot } from "react-icons/si";
import { pickPreferredFemalePtBrVoice } from "@/lib/voice/female-voice";

type WrongQuestion = {
  position: number;
  subject: string;
  topic: string;
  subtopic: string;
  statement: string;
  selectedAnswer: string | null;
  correctAnswer: string;
  explanation: string;
};

type Props = {
  userName: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  questions: WrongQuestion[];
};

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || "Professor";
}

export default function SimulationResultAssistant({
  userName,
  score,
  correctAnswers,
  wrongAnswers,
  totalQuestions,
  questions,
}: Props) {
  const [speaking, setSpeaking] = useState(false);
  const [active, setActive] = useState(true);
  const name = firstName(userName);

  const summary = useMemo(() => {
    if (wrongAnswers === 0) {
      return `${name}, você concluiu o simulado com ${score}% de aproveitamento. Foram ${correctAnswers} acertos em ${totalQuestions} questões, sem erros. Excelente. Você pode seguir para um novo simulado ou revisar o desempenho por assunto.`;
    }

    const wrongNumbers = questions
      .slice(0, 8)
      .map((question) => question.position)
      .join(", ");

    const subjects = Array.from(
      new Set(
        questions
          .map((question) => question.subject)
          .filter(Boolean)
      )
    )
      .slice(0, 3)
      .join(", ");

    const questionText =
      wrongAnswers <= 8
        ? `Você errou as questões ${wrongNumbers}.`
        : `Entre os erros estão as questões ${wrongNumbers} e outras.`;

    const subjectText = subjects
      ? `Os principais assuntos para revisar são ${subjects}.`
      : "";

    return `${name}, seu simulado terminou. Você acertou ${correctAnswers} de ${totalQuestions} questões e errou ${wrongAnswers}. Seu aproveitamento foi de ${score}%. ${questionText} ${subjectText} Abaixo eu deixei a revisão das questões para você entender onde errou e por quê.`;
  }, [
    name,
    score,
    correctAnswers,
    wrongAnswers,
    totalQuestions,
    questions,
  ]);

  function speakSummary() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;
    synth.cancel();
    synth.resume();

    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = "pt-BR";
    utterance.rate = 1.1;
    utterance.pitch = 1.06;

    const femaleVoice = pickPreferredFemalePtBrVoice(synth.getVoices());
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    synth.speak(utterance);
  }

  function stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setActive(false);
  }

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      speakSummary();
    }, 700);

    return () => globalThis.clearTimeout(timer);
    // Fala uma única vez ao abrir o resultado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {active && (
        <div className="fixed bottom-20 right-4 z-40 max-w-[min(80vw,320px)] rounded-2xl border border-violet-400/20 bg-slate-950/95 px-3 py-3 text-xs text-slate-300 shadow-2xl backdrop-blur sm:bottom-24 sm:right-6">
          <p className="font-semibold text-violet-300">
            Resultado do simulado
          </p>
          <p className="mt-1 leading-5">
            {speaking
              ? "Estou analisando seu resultado..."
              : `${score}% · ${correctAnswers} acertos · ${wrongAnswers} erros`}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={speakSummary}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 font-semibold hover:bg-white/10"
            >
              Ouvir novamente
            </button>
            <button
              type="button"
              onClick={stop}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 font-semibold hover:bg-white/10"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (active) {
            stop();
          } else {
            setActive(true);
            globalThis.setTimeout(() => speakSummary(), 100);
          }
        }}
        aria-label={active ? "Fechar análise da IA" : "Abrir análise da IA"}
        title={active ? "Fechar IA" : "Abrir IA"}
        className={`fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold shadow-2xl transition sm:bottom-6 sm:right-6 ${
          speaking
            ? "bg-red-500 text-white"
            : active
              ? "bg-violet-600 text-white hover:bg-violet-500"
              : "border border-violet-400/30 bg-slate-900 text-violet-300 hover:bg-violet-500/15"
        }`}
      >
        {speaking ? "●" : <SiProbot className="h-6 w-6" aria-hidden="true" />}
      </button>
    </>
  );
}
