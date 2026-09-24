"use client";

import { useEffect, useMemo, useState } from "react";

type VoiceOption = {
  key: string;
  text: string;
};

type VoiceQuestion = {
  linkId: string;
  position: number;
  subject: string;
  statement: string;
  options: VoiceOption[];
};

type Props = {
  questions: VoiceQuestion[];
};

function normalizeCommand(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function VoiceSimulationAssistant({ questions }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoListen, setAutoListen] = useState(true);
  const [rate, setRate] = useState(0.95);
  const [lastHeard, setLastHeard] = useState("");
  const [recognitionSupported, setRecognitionSupported] = useState<boolean | null>(null);

  const current = questions[currentIndex] ?? null;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supported =
      "SpeechRecognition" in window ||
      "webkitSpeechRecognition" in window;

    setRecognitionSupported(supported);

    if (!supported) {
      setAutoListen(false);
    }
  }, []);

  const speechText = useMemo(() => {
    if (!current) return "";

    const optionsText = current.options
      .map((option) => `Alternativa ${option.key}. ${option.text}`)
      .join(". ");

    return `Questão ${current.position} de ${questions.length}. ${current.subject}. ${current.statement}. ${optionsText}. Qual alternativa você escolhe?`;
  }, [current, questions.length]);

  function speak(text: string, listenAfter = false) {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (listenAfter && autoListen) {
        window.setTimeout(() => startListening(), 150);
      }
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.onend = () => {
      if (listenAfter && autoListen) {
        window.setTimeout(() => startListening(), 250);
      }
    };
    window.speechSynthesis.speak(utterance);
  }

  function scrollToQuestion(index: number) {
    const question = questions[index];
    if (!question) return;

    const element = document.getElementById(`question-${question.linkId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function selectAlternative(letter: string) {
    if (!current) return;

    const normalizedLetter = letter.toUpperCase();
    const optionExists = current.options.some((option) => option.key.toUpperCase() === normalizedLetter);

    if (!optionExists) {
      speak(`A alternativa ${normalizedLetter} não existe nesta questão.`);
      return;
    }

    const selector = `input[name="answer_${current.linkId}"][value="${normalizedLetter}"]`;
    const radio = document.querySelector<HTMLInputElement>(selector);

    if (!radio) return;

    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));

    speak(`Alternativa ${normalizedLetter} registrada.`);

    window.setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        const nextIndex = currentIndex + 1;
        const next = questions[nextIndex];
        setCurrentIndex(nextIndex);
        scrollToQuestion(nextIndex);

        window.setTimeout(() => {
          if (!next) return;
          const optionsText = next.options
            .map((option) => `Alternativa ${option.key}. ${option.text}`)
            .join(". ");

          speak(
            `Questão ${next.position} de ${questions.length}. ${next.subject}. ${next.statement}. ${optionsText}. Qual alternativa você escolhe?`,
            true
          );
        }, 500);
      } else {
        speak(
          "Alternativa registrada. Você chegou à última questão. Quando quiser, pode finalizar e corrigir o simulado."
        );
      }
    }, 700);
  }

  function handleCommand(raw: string) {
    const command = normalizeCommand(raw);
    setLastHeard(raw);

    const alternativeMatch = command.match(
      /(?:alternativa|letra|resposta)?\s*([a-e])\b/
    );

    if (alternativeMatch?.[1]) {
      selectAlternative(alternativeMatch[1]);
      return;
    }

    if (
      command.includes("repete") ||
      command.includes("repetir") ||
      command.includes("le novamente") ||
      command.includes("ler novamente")
    ) {
      speak(speechText, true);
      return;
    }

    if (
      command.includes("proxima") ||
      command.includes("proximo") ||
      command.includes("avancar")
    ) {
      if (currentIndex < questions.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        scrollToQuestion(nextIndex);
        window.setTimeout(() => {
          const next = questions[nextIndex];
          if (!next) return;
          const optionsText = next.options
            .map((option) => `Alternativa ${option.key}. ${option.text}`)
            .join(". ");
          speak(
            `Questão ${next.position} de ${questions.length}. ${next.subject}. ${next.statement}. ${optionsText}. Qual alternativa você escolhe?`,
            true
          );
        }, 500);
      } else {
        speak("Você já está na última questão.");
      }
      return;
    }

    if (
      command.includes("anterior") ||
      command.includes("voltar uma") ||
      command.includes("questao anterior")
    ) {
      if (currentIndex > 0) {
        const previousIndex = currentIndex - 1;
        setCurrentIndex(previousIndex);
        scrollToQuestion(previousIndex);
      } else {
        speak("Você já está na primeira questão.");
      }
      return;
    }

    if (command.includes("mais devagar") || command.includes("fala devagar")) {
      const nextRate = Math.max(0.7, rate - 0.1);
      setRate(nextRate);
      window.setTimeout(() => speak("Certo. Vou falar mais devagar."), 50);
      return;
    }

    if (command.includes("mais rapido") || command.includes("fala rapido")) {
      const nextRate = Math.min(1.2, rate + 0.1);
      setRate(nextRate);
      window.setTimeout(() => speak("Certo. Vou falar um pouco mais rápido."), 50);
      return;
    }

    if (command.includes("ler questao") || command.includes("le a questao")) {
      speak(speechText, true);
      return;
    }

    speak(
      "Não entendi esse comando. Você pode dizer, por exemplo, letra B, repetir questão, próxima questão ou mais devagar."
    );
  }

  function startListening() {
    if (typeof window === "undefined") return;

    const SpeechRecognitionConstructor =
      (window as unknown as {
        SpeechRecognition?: new () => {
          lang: string;
          interimResults: boolean;
          continuous: boolean;
          onstart: (() => void) | null;
          onend: (() => void) | null;
          onerror: (() => void) | null;
          onresult: ((event: { results?: { 0?: { 0?: { transcript?: string } } } }) => void) | null;
          start: () => void;
        };
        webkitSpeechRecognition?: new () => {
          lang: string;
          interimResults: boolean;
          continuous: boolean;
          onstart: (() => void) | null;
          onend: (() => void) | null;
          onerror: (() => void) | null;
          onresult: ((event: { results?: { 0?: { 0?: { transcript?: string } } } }) => void) | null;
          start: () => void;
        };
      }).SpeechRecognition ??
      (window as unknown as {
        webkitSpeechRecognition?: new () => {
          lang: string;
          interimResults: boolean;
          continuous: boolean;
          onstart: (() => void) | null;
          onend: (() => void) | null;
          onerror: (() => void) | null;
          onresult: ((event: { results?: { 0?: { 0?: { transcript?: string } } } }) => void) | null;
          start: () => void;
        };
      }).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setRecognitionSupported(false);
      setAutoListen(false);
      speak(
        "Neste navegador, a resposta por voz não está disponível. A leitura em voz alta continua funcionando, e você pode marcar a alternativa tocando na tela."
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
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) handleCommand(transcript);
    };

    recognition.start();
  }

  if (!current) return null;

  return (
    <section className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            Simulado por voz
          </p>
          <h3 className="mt-1 text-lg font-bold">
            Questão {current.position} de {questions.length}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Diga “letra B”, “repete”, “próxima questão”, “anterior” ou “mais devagar”.
          </p>
          <p className="mt-1 text-xs text-emerald-300/80">
            {recognitionSupported === false
              ? "Neste celular, a leitura por voz funciona, mas o reconhecimento de fala do navegador não está disponível."
              : autoListen
                ? "Escuta automática ativa: depois da leitura, o microfone abre sozinho."
                : "Escuta manual: use o botão Responder por voz."}
          </p>
          {lastHeard && (
            <p className="mt-2 text-xs text-slate-500">
              Ouvi: “{lastHeard}”
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => speak(speechText, true)}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/10"
          >
            🔊 Ler questão
          </button>

          <button
            type="button"
            onClick={startListening}
            disabled={recognitionSupported === false}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              listening
                ? "bg-red-500/20 text-red-300"
                : "bg-violet-600 text-white hover:bg-violet-500"
            }`}
          >
            {recognitionSupported === false
              ? "🎙 Voz indisponível"
              : listening
                ? "● Ouvindo..."
                : "🎙 Responder por voz"}
          </button>

          <button
            type="button"
            onClick={() => setAutoListen((value) => !value)}
            disabled={recognitionSupported === false}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {recognitionSupported === false
              ? "🎧 Escuta indisponível"
              : autoListen
                ? "🎧 Escuta automática"
                : "🎧 Escuta manual"}
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !voiceEnabled;
              setVoiceEnabled(next);
              if (!next && "speechSynthesis" in window) window.speechSynthesis.cancel();
            }}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/10"
          >
            {voiceEnabled ? "Voz ligada" : "Voz desligada"}
          </button>
        </div>
      </div>
    </section>
  );
}
