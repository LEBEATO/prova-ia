const STORAGE_KEY = "provaia-female-voice-v2";

const FEMALE_HINTS = [
  "francisca",
  "maria",
  "luciana",
  "fernanda",
  "camila",
  "vitoria",
  "vitória",
  "helena",
  "leticia",
  "letícia",
  "isabela",
  "beatriz",
  "ana",
  "juliana",
  "joana",
  "female",
  "feminina",
];

function isPtBr(voice: SpeechSynthesisVoice) {
  return voice.lang?.toLowerCase().startsWith("pt-br");
}

function isKnownFemaleVoice(voice: SpeechSynthesisVoice) {
  const name = voice.name.toLowerCase();
  return FEMALE_HINTS.some((hint) => name.includes(hint));
}

export function pickPreferredFemalePtBrVoice(
  voices: SpeechSynthesisVoice[]
) {
  const ptBrVoices = voices.filter(isPtBr);
  const femaleVoices = ptBrVoices.filter(isKnownFemaleVoice);

  if (!femaleVoices.length) return null;

  if (typeof window !== "undefined") {
    const savedName = window.localStorage.getItem(STORAGE_KEY);
    const savedVoice = savedName
      ? femaleVoices.find((voice) => voice.name === savedName)
      : null;

    if (savedVoice) return savedVoice;
  }

  const preferredOrder = [
    "francisca",
    "maria",
    "luciana",
    "fernanda",
    "camila",
    "vitoria",
    "vitória",
    "helena",
    "leticia",
    "letícia",
    "isabela",
    "beatriz",
    "ana",
    "juliana",
    "joana",
    "female",
    "feminina",
  ];

  let selected: SpeechSynthesisVoice | null = null;

  for (const hint of preferredOrder) {
    selected =
      femaleVoices.find((voice) =>
        voice.name.toLowerCase().includes(hint)
      ) ?? null;

    if (selected) break;
  }

  selected ??= femaleVoices[0] ?? null;

  if (selected && typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, selected.name);
  }

  return selected;
}
