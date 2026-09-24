const STORAGE_KEY = "provaia-female-voice";

const preferredNames = [
  "francisca",
  "maria",
  "luciana",
  "fernanda",
  "camila",
  "vitoria",
  "vitória",
  "helena",
  "female",
  "feminina",
  "google português do brasil",
  "google portugues do brasil",
];

export function pickPreferredFemalePtBrVoice(
  voices: SpeechSynthesisVoice[]
) {
  const ptBr = voices.filter((voice) =>
    voice.lang?.toLowerCase().startsWith("pt-br")
  );

  if (!ptBr.length) return null;

  if (typeof window !== "undefined") {
    const savedName = window.localStorage.getItem(STORAGE_KEY);
    const savedVoice = savedName
      ? ptBr.find((voice) => voice.name === savedName)
      : null;

    if (savedVoice) return savedVoice;
  }

  let selected: SpeechSynthesisVoice | null = null;

  for (const name of preferredNames) {
    selected = ptBr.find((voice) =>
      voice.name.toLowerCase().includes(name)
    ) ?? null;

    if (selected) break;
  }

  // Mantém uma única voz pt-BR consistente no aparelho.
  selected ??= ptBr[0] ?? null;

  if (selected && typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, selected.name);
  }

  return selected;
}
