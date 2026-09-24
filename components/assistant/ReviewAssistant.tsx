"use client";

import { useMemo, useState } from "react";
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
  questions: WrongQuestion[];
};

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || "professor";
}

export default function ReviewAssistant({
  userName,
  score,
  correctAnswers,
  wrongAnswers,
  questions,
}: Props) {
  const name = firstName(userName);
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [details, setDetails] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const current = questions[index] ?? null;

  const intro = useMemo(() => {
    if (!questions.length) {
      return `${name}, você acertou todas as questões. Excelente resultado. Posso te ajudar a escolher o próximo treino no dashboard.`;
    }

    return `${name}, você terminou com ${score}% de aproveitamento: ${correctAnswers} acertos e ${wrongAnswers} erros. Separei as questões que merecem revisão. Vamos analisar uma por uma, sem pressa.`;
  }, [name, score, correctAnswers, wrongAnswers, questions.length]);

  function speak(text: string) {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.96;
    utterance.pitch = 1.03;
    const femaleVoice = pickPreferredFemalePtBrVoice(window.speechSynthesis.getVoices());
    if (femaleVoice) utterance.voice = femaleVoice;
    window.speechSynthesis.speak(utterance);
  }

  function startReview() {
    setStarted(true);
    if (current) {
      speak(
        `Vamos revisar a questão ${current.position}, de ${current.subject}. Você marcou ${current.selectedAnswer ?? "nenhuma alternativa"} e a correta era ${current.correctAnswer}. ${current.explanation}`
      );
    } else {
      speak(intro);
    }
  }

  function nextQuestion() {
    if (index >= questions.length - 1) return;
    const next = index + 1;
    setIndex(next);
    setDetails(false);
    const question = questions[next];
    speak(
      `Agora a questão ${question.position}, de ${question.subject}. Você marcou ${question.selectedAnswer ?? "nenhuma alternativa"} e a correta era ${question.correctAnswer}. ${question.explanation}`
    );
  }

  if (!questions.length) {
    return (
      <section className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 sm:p-6">
        <p className="text-sm font-semibold text-emerald-300">Assistente Prova IA</p>
        <p className="mt-3 text-sm leading-7 text-slate-200">{intro}</p>
        <a
          href="/dashboard"
          className="mt-4 inline-flex rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold hover:bg-violet-500"
        >
          Conversar no dashboard
        </a>
      </section>
    );
  }

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-white/[0.04] to-transparent">
      <div className="border-b border-white/10 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-300">Revisão com o Assistente Prova IA</p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl">Vamos entender seus erros juntos</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !voiceEnabled;
              setVoiceEnabled(next);
              if (!next && "speechSynthesis" in window) window.speechSynthesis.cancel();
            }}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
          >
            {voiceEnabled ? "🔊 Voz ligada" : "🔇 Voz desligada"}
          </button>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{intro}</p>
      </div>

      {!started ? (
        <div className="p-5 sm:p-6">
          <button
            type="button"
            onClick={startReview}
            className="min-h-12 rounded-xl bg-violet-600 px-5 py-3 font-semibold hover:bg-violet-500"
          >
            Revisar meus erros
          </button>
        </div>
      ) : current ? (
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-violet-500/10 px-3 py-1 text-violet-300">
              Erro {index + 1} de {questions.length}
            </span>
            <span className="text-slate-500">{current.subject}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">{current.topic}</span>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-200">{current.statement}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-xs uppercase tracking-wide text-red-300">Você marcou</p>
              <p className="mt-1 font-semibold">{current.selectedAnswer ?? "Sem resposta"}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-300">Resposta correta</p>
              <p className="mt-1 font-semibold">{current.correctAnswer}</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-sm font-semibold text-violet-300">Por que?</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">{current.explanation}</p>

            {details && (
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Para fixar melhor, releia o enunciado procurando as palavras que limitam ou ampliam a afirmação. Depois compare cada alternativa com o conceito central de {current.subtopic || current.topic}. O objetivo não é decorar a letra correta, mas reconhecer o raciocínio usado pela questão.
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setDetails((value) => !value);
                if (!details) {
                  speak(
                    `Vou explicar de outro jeito. Procure primeiro o conceito central de ${current.subtopic || current.topic} e depois elimine as alternativas que extrapolam ou contradizem esse conceito.`
                  );
                }
              }}
              className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/10"
            >
              {details ? "Ocultar explicação extra" : "Explica de outro jeito"}
            </button>

            <button
              type="button"
              onClick={() =>
                speak(
                  `Questão ${current.position}. ${current.statement}. Você marcou ${current.selectedAnswer ?? "nenhuma alternativa"}. A correta era ${current.correctAnswer}. ${current.explanation}`
                )
              }
              className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/10"
            >
              Ouvir novamente
            </button>

            {index < questions.length - 1 ? (
              <button
                type="button"
                onClick={nextQuestion}
                className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold hover:bg-violet-500"
              >
                Próximo erro
              </button>
            ) : (
              <a
                href="/dashboard"
                className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold hover:bg-violet-500"
              >
                Continuar com o assistente
              </a>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
