export function pickPreferredFemalePtBrVoice(
  voices: SpeechSynthesisVoice[]
) {
  const ptBr = voices.filter((voice) =>
    voice.lang?.toLowerCase().startsWith("pt-br")
  );

  if (!ptBr.length) return null;

  const preferredNames = [
    "francisca",
    "maria",
    "luciana",
    "fernanda",
    "camila",
    "vitoria",
    "vitória",
    "female",
    "feminina",
  ];

  for (const name of preferredNames) {
    const match = ptBr.find((voice) =>
      voice.name.toLowerCase().includes(name)
    );

    if (match) return match;
  }

  const googlePtBr = ptBr.find((voice) =>
    voice.name.toLowerCase().includes("google")
  );

  return googlePtBr ?? ptBr[0];
}
