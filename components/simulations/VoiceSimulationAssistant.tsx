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
  const currentIndexRef = useRef(0);
  const advancingRef = useRef(false);
  const activeRef = useRef(false);
  const recognitionRef = useRef<{ abort?: () => void; stop?: () => void } | null>(null);

  const current = questions[currentIndex] ?? null;

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!active) return;

    function handleManualAnswer(event: Event) {
      const target = event.target as HTMLInputElement | null;
      if (!target || target.type !== "radio" || !target.name.startsWith("answer_")) {
        return;
      }

      const activeIndex = currentIndexRef.current;
      const activeQuestion = questions[activeIndex];
      if (!activeQuestion) return;

      const expectedName = `answer_${activeQuestion.linkId}`;
      if (target.name !== expectedName || advancingRef.current) {
        return;
      }

      const selected = target.value?.toUpperCase();
      if (!selected) return;

      advancingRef.current = true;
      retryRef.current = 0;
      setLastHeard(`Alternativa ${selected} selecionada na tela`);

      if (activeIndex < questions.length - 1) {
        const nextIndex = activeIndex + 1;
        speak(`Certo. Alternativa ${selected} marcada. Vamos para a próxima questão.`);

        window.setTimeout(() => {
          currentIndexRef.current = nextIndex;
          setCurrentIndex(nextIndex);
          scrollToQuestion(nextIndex);

          window.setTimeout(() => {
            advancingRef.current = false;
            readQuestion(nextIndex);
          }, 450);
        }, 650);
      } else {
        speak(
          `Certo. Alternativa ${selected} marcada. Você chegou à última questão. Agora pode finalizar o simulado para ver o resultado.`
        );
        setVoiceStatus("Última questão respondida.");
        advancingRef.current = false;
      }
    }

    document.addEventListener("change", handleManualAnswer);
    return () => document.removeEventListener("change", handleManualAnswer);
  }, [active, questions]);

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
        if (listenAfter && activeRef.current && recognitionSupported !== false) {
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

  function readQuestion(index = currentIndexRef.current) {
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
    const activeIndex = currentIndexRef.current;
    const activeQuestion = questions[activeIndex];
    if (!activeQuestion) return;

    const normalizedLetter = letter.toUpperCase();
    const optionExists = activeQuestion.options.some(
      (option) => option.key.toUpperCase() === normalizedLetter
    );

    if (!optionExists) {
      speak(
        `Essa questão não tem a alternativa ${normalizedLetter}. As opções disponíveis são ${activeQuestion.options
          .map((option) => option.key)
          .join(", ")}. Diga uma dessas alternativas.`,
        true
      );
      return;
    }

    const selector = `input[name="answer_${activeQuestion.linkId}"][value="${normalizedLetter}"]`;
    const radio = document.querySelector<HTMLInputElement>(selector);

    if (!radio) {
      speak("Não consegui registrar essa resposta. Vamos tentar novamente.", true);
      return;
    }

    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
    retryRef.current = 0;
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

    const activeQuestion = questions[currentIndexRef.current];
    const validLetters = activeQuestion?.options.map((option) => option.key.toUpperCase()) ?? [];
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
      const activeIndex = currentIndexRef.current;
      if (activeIndex < questions.length - 1) {
        const nextIndex = activeIndex + 1;
        currentIndexRef.current = nextIndex;
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
      const activeIndex = currentIndexRef.current;
      if (activeIndex > 0) {
        const previousIndex = activeIndex - 1;
        currentIndexRef.current = previousIndex;
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
    recognitionRef.current = recognition;
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
      recognitionRef.current = null;

      if (!receivedResult && activeRef.current) {
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

      const activeQuestion = questions[currentIndexRef.current];
      const validLetters = activeQuestion?.options.map((option) => option.key.toUpperCase()) ?? [];
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
    activeRef.current = true;
    setActive(true);
    retryRef.current = 0;
    currentIndexRef.current = currentIndex;
    scrollToQuestion(currentIndexRef.current);
    readQuestion(currentIndexRef.current);
  }

  function stopAiFlow() {
    activeRef.current = false;
    setActive(false);
    setListening(false);
    setLastHeard("");
    setVoiceStatus("IA desligada.");
    advancingRef.current = false;
    retryRef.current = 0;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    try {
      recognitionRef.current?.abort?.();
    } catch {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // O reconhecimento já pode ter sido encerrado pelo navegador.
      }
    }

    recognitionRef.current = null;
  }

  function toggleAiFlow() {
    if (activeRef.current) {
      stopAiFlow();
    } else {
      startAiFlow();
    }
  }

  return (
    <>
      {active && (
        <div className="fixed bottom-44 right-6 z-40 max-w-[min(78vw,280px)] rounded-2xl border border-violet-400/20 bg-slate-950/95 px-3 py-2 text-xs text-slate-300 shadow-2xl backdrop-blur sm:bottom-24 sm:right-6">
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
        onClick={toggleAiFlow}
        aria-label={active ? "Desligar assistente IA" : "Ligar assistente IA"}
        title={active ? "Desligar IA" : "Ligar IA"}
        className={`fixed bottom-28 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold shadow-2xl transition sm:bottom-6 sm:right-6 ${
          listening
            ? "bg-red-500 text-white"
            : active
              ? "bg-violet-600 text-white hover:bg-violet-500"
              : "border border-violet-400/30 bg-slate-900 text-violet-300 hover:bg-violet-500/15"
        }`}
      >
        {listening ? "●" : <SiProbot className="h-6 w-6" aria-hidden="true" />}
      </button>
    </>
  );
}
