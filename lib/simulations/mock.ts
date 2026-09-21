export type MockTopic = {
  category: string;
  subject: string;
  subtopic: string | null;
  expected_questions: number | null;
};

const LETTERS = ["A", "B", "C", "D"];

export function buildMockQuestions(topics: MockTopic[], count: number) {
  const safeTopics =
    topics.length > 0
      ? topics
      : [
          {
            category: "Conhecimentos Gerais",
            subject: "Língua Portuguesa",
            subtopic: "Interpretação de texto",
            expected_questions: count,
          },
        ];

  const weighted = safeTopics.flatMap((topic) => {
    const weight = Math.max(1, topic.expected_questions ?? 1);
    return Array.from({ length: weight }, () => topic);
  });

  return Array.from({ length: count }, (_, index) => {
    const topic = weighted[index % weighted.length];
    const correct = LETTERS[index % LETTERS.length];
    const subject = topic.subject;
    const subtopic = topic.subtopic || "conteúdo previsto no edital";

    const options = LETTERS.map((letter) => ({
      key: letter,
      text:
        letter === correct
          ? `Alternativa correta de teste sobre ${subject} — ${subtopic}.`
          : `Alternativa incorreta de teste ${letter} sobre ${subject}.`,
    }));

    return {
      subject,
      topic: topic.category,
      subtopic,
      difficulty: index % 3 === 0 ? "fácil" : index % 3 === 1 ? "média" : "difícil",
      statement: `[MODO TESTE] Questão ${index + 1}: considerando ${subject}, no tópico ${subtopic}, assinale a alternativa marcada como correta para validar o fluxo do simulado.`,
      options,
      correct_answer: correct,
      explanation: `MODO TESTE: a alternativa ${correct} foi definida como correta apenas para validar correção, histórico e desempenho.`,
      source_reference: "MODO TESTE",
      is_ai_generated: true,
    };
  });
}
