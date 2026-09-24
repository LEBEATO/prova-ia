"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pickPreferredFemalePtBrVoice } from "@/lib/voice/female-voice";
import { SiProbot } from "react-icons/si";

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

type RecognitionEventLike = {
  results?: {
    0?: {
      length?: number;
      [key: number]: { transcript?: string; confidence?: number } | undefined;
    };
  };
};

function normalizeCommand(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,!?;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectAlternative(raw: string, validLetters: string[]) {
  const command = normalizeCommand(raw);

  const spokenMap: Record<string, string> = {
    a: "A",
    ah: "A",
    be: "B",
    b: "B",
    ce: "C",
    c: "C",
    se: "C",
    de: "D",
    d: "D",
    e: "E",
    eh: "E",
    efe: "F",
    f: "F",
    ge: "G",
    g: "G",
    aga: "H",
    h: "H",
    i: "I",
    jota: "J",
    j: "J",
    ca: "K",
    k: "K",
    ele: "L",
    l: "L",
    eme: "M",
    m: "M",
    ene: "N",
    n: "N",
    o: "O",
    pe: "P",
    p: "P",
    que: "Q",
    q: "Q",
    erre: "R",
    r: "R",
    esse: "S",
    s: "S",
    te: "T",
    t: "T",
    u: "U",
    ve: "V",
    v: "V",
    xis: "X",
    x: "X",
    ze: "Z",
    z: "Z",
  };

  const tokens = command.split(" ");
  const candidates: string[] = [];

  const explicit = command.match(
    /(?:alternativa|letra|opcao|resposta|marco|escolho|vou de|acho que e|acho que seja|minha resposta e)\s+([a-z]+)\b/
  )?.[1];

  if (explicit) candidates.push(explicit);

  if (tokens.length <= 6 && tokens.length > 0) {
    candidates.push(tokens[tokens.length - 1]);
  }

  for (const candidate of candidates) {
    const mapped = spokenMap[candidate] ?? candidate.toUpperCase();

    if (validLetters.includes(mapped)) {
      return mapped;
    }
  }

  return null;
}

export default function VoiceSimulationAssistant({ questions }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [rate, setRate] = useState(1.12);
  const [lastHeard, setLastHeard] = useState("");
  const [recognitionSupported, setRecognitionSupported] = useState<boolean | null>(null);
  const [voiceStatus, setVoiceStatus] = useState("Toque na IA para começar.");
  const [active, setActive] = useState(false);
  const retryRef = useRef(0);

  const current = questions[currentIndex] ?? null;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supported =
      "SpeechRecognition" in window ||
      "webkitSpeechRecognition" in window;

    setRecognitionSupported(supported);
  }, []);

  const speechText = useMemo(() => {
    if (!current) return "";

    const optionsText = current.options
      .map((option) => `Alternativa ${option.key}. ${option.text}`)
      .join(". ");

    return `Questão ${current.position} de ${questions.length}. ${current.subject}. ${current.statement}. ${optionsText}. Qual alternativa você escolhe?`;
  }, [current, questions.length]);

  function speak(text: string, listenAfter = false) {
    if (typeof window === "undefined") return;

    if (!("speechSynthesis" in window)) {
      setVoiceStatus("Este navegador não oferece leitura em voz alta.");
      return;
    }

    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      synth.resume();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = rate;
      utterance.pitch = 1.06;

      const femaleVoice = pickPreferredFemalePtBrVoice(synth.getVoices());
      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.onstart = () => setVoiceStatus("IA falando...");
      utterance.onerror = () =>
        setVoiceStatus("Não consegui reproduzir a voz neste aparelho.");
      utterance.onend = () => {
        if (listenAfter && recognitionSupported !== false) {
          setVoiceStatus("Agora pode responder.");
          window.setTimeout(() => startListening(), 250);
        } else {
          setVoiceStatus("Pronta.");
        }
      };

      synth.speak(utterance);
    } catch {
      setVoiceStatus("Não consegui iniciar a leitura em voz alta.");
    }
  }

  function scrollToQuestion(index: number) {
    const question = questions[index];
    if (!question) return;

    const element = document.getElementById(`question-${question.linkId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function readQuestion(index = currentIndex) {
    const question = questions[index];
    if (!question) return;

    const optionsText = question.options
      .map((option) => `Alternativa ${option.key}. ${option.text}`)
      .join(". ");

    speak(
      `Questão ${question.position} de ${questions.length}. ${question.subject}. ${question.statement}. ${optionsText}. Qual alternativa você escolhe?`,
      true
    );
  }

  function selectAlternative(letter: string) {
    if (!current) return;

    const normalizedLetter = letter.toUpperCase();
    const optionExists = current.options.some(
      (option) => option.key.toUpperCase() === normalizedLetter
    );

    if (!optionExists) {
      speak(
        `Essa questão não tem a alternativa ${normalizedLetter}. As opções disponíveis são ${current.options
          .map((option) => option.key)
          .join(", ")}. Diga uma dessas alternativas.`,
        true
      );
      return;
    }

    const selector = `input[name="answer_${current.linkId}"][value="${normalizedLetter}"]`;
    const radio = document.querySelector<HTMLInputElement>(selector);

    if (!radio) {
      speak("Não consegui registrar essa resposta. Vamos tentar novamente.", true);
      return;
    }

    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
    retryRef.current = 0;

    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;

      speak(`Entendi. Alternativa ${normalizedLetter} registrada. Vamos para a próxima.`);

      window.setTimeout(() => {
        setCurrentIndex(nextIndex);
        scrollToQuestion(nextIndex);

        window.setTimeout(() => {
          readQuestion(nextIndex);
        }, 450);
      }, 650);
    } else {
      speak(
        `Entendi. Alternativa ${normalizedLetter} registrada. Você terminou as questões. Agora pode finalizar o simulado para ver o resultado.`
      );
      setVoiceStatus("Simulado respondido por voz.");
    }
  }

  function reprompt() {
    retryRef.current += 1;

    if (retryRef.current === 1) {
      speak(
        "Não entendi sua resposta. Pode repetir dizendo, por exemplo, alternativa D.",
        true
      );
      return;
    }

    retryRef.current = 0;
    speak(
      "Ainda não consegui entender. Vou repetir a questão para você.",
      false
    );

    window.setTimeout(() => readQuestion(), 900);
  }

  function handleCommand(raw: string) {
    const command = normalizeCommand(raw);
    setLastHeard(raw);

    const validLetters = current?.options.map((option) => option.key.toUpperCase()) ?? [];
    const alternative = detectAlternative(raw, validLetters);
    if (alternative) {
      selectAlternative(alternative);
      return;
    }

    if (
      command.includes("repete") ||
      command.includes("repetir") ||
      command.includes("le novamente") ||
      command.includes("ler novamente") ||
      command.includes("repete a questao")
    ) {
      retryRef.current = 0;
      readQuestion();
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
        window.setTimeout(() => readQuestion(nextIndex), 450);
      } else {
        speak("Você já está na última questão.", true);
      }
      return;
    }

    if (
      command.includes("anterior") ||
      command.includes("voltar") ||
      command.includes("questao anterior")
    ) {
      if (currentIndex > 0) {
        const previousIndex = currentIndex - 1;
        setCurrentIndex(previousIndex);
        scrollToQuestion(previousIndex);
        window.setTimeout(() => readQuestion(previousIndex), 450);
      } else {
        speak("Você já está na primeira questão.", true);
      }
      return;
    }

    if (
      command.includes("mais devagar") ||
      command.includes("fala devagar")
    ) {
      const nextRate = Math.max(0.8, rate - 0.1);
      setRate(nextRate);
      speak("Certo. Vou falar mais devagar. Vou repetir a questão.");
      window.setTimeout(() => readQuestion(), 800);
      return;
    }

    if (
      command.includes("mais rapido") ||
      command.includes("fala rapido")
    ) {
      const nextRate = Math.min(1.3, rate + 0.1);
      setRate(nextRate);
      speak("Certo. Vou falar um pouco mais rápido. Vou repetir a questão.");
      window.setTimeout(() => readQuestion(), 800);
      return;
    }

    reprompt();
  }

  async function startListening() {
    if (typeof window === "undefined") return;

    const SpeechRecognitionConstructor =
      (window as unknown as {
        SpeechRecognition?: new () => any;
        webkitSpeechRecognition?: new () => any;
      }).SpeechRecognition ??
      (window as unknown as {
        webkitSpeechRecognition?: new () => any;
      }).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setRecognitionSupported(false);
      setVoiceStatus(
        "Resposta por voz não está disponível neste navegador."
      );
      return;
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      setVoiceStatus("Libere o microfone nas configurações do navegador.");
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 5;

    let receivedResult = false;

    recognition.onstart = () => {
      setListening(true);
      setVoiceStatus("Ouvindo sua resposta...");
    };

    recognition.onend = () => {
      setListening(false);

      if (!receivedResult && active) {
        setVoiceStatus("Não ouvi uma resposta.");
      }
    };

    recognition.onerror = (event: { error?: string }) => {
      setListening(false);

      if (event?.error === "no-speech") {
        reprompt();
        return;
      }

      setVoiceStatus("Não consegui ouvir. Toque na IA para tentar novamente.");
    };

    recognition.onresult = (event: RecognitionEventLike) => {
      receivedResult = true;

      const result = event.results?.[0];
      const candidates: string[] = [];

      if (result) {
        const length = Number(result.length ?? 0);
        for (let index = 0; index < length; index += 1) {
          const transcript = result[index]?.transcript?.trim();
          if (transcript) candidates.push(transcript);
        }
      }

      const validLetters = current?.options.map((option) => option.key.toUpperCase()) ?? [];
      const recognized = candidates.find((candidate) =>
        detectAlternative(candidate, validLetters)
      );

      const transcript = recognized ?? candidates[0] ?? "";

      if (transcript) {
        setLastHeard(transcript);
        handleCommand(transcript);
      } else {
        reprompt();
      }
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
      setVoiceStatus("Não foi possível iniciar o microfone agora.");
    }
  }

  if (!current) return null;

  function startAiFlow() {
    setActive(true);
    retryRef.current = 0;
    scrollToQuestion(currentIndex);
    readQuestion();
  }

  return (
    <>
      {active && (
        <div className="fixed bottom-20 right-4 z-40 max-w-[min(78vw,280px)] rounded-2xl border border-violet-400/20 bg-slate-950/95 px-3 py-2 text-xs text-slate-300 shadow-2xl backdrop-blur sm:bottom-24 sm:right-6">
          <p className="font-semibold text-violet-300">
            Questão {current.position} de {questions.length}
          </p>
          <p className="mt-1">
            {listening ? "Estou ouvindo..." : voiceStatus}
          </p>
          {lastHeard && (
            <p className="mt-1 truncate text-slate-500">
              Você disse: “{lastHeard}”
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={listening ? undefined : startAiFlow}
        disabled={listening}
        aria-label="Assistente IA do simulado"
        title="Assistente IA"
        className={`fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold shadow-2xl transition sm:bottom-6 sm:right-6 ${
          listening
            ? "bg-red-500 text-white"
            : "bg-violet-600 text-white hover:bg-violet-500"
        }`}
      >
        {listening ? "●" : <SiProbot className="h-6 w-6" aria-hidden="true" />}
      </button>
    </>
  );
}
