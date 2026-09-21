type NoticeTopicAnalysis = {
  category: string;
  subject: string;
  subtopic: string;
  expected_questions: number;
  weight: number;
  source_reference: string;
};

export type NoticeAnalysis = {
  board_name: string;
  organization_name: string;
  city: string;
  state: string;
  position_name: string;
  exam_date: string;
  total_questions: number;
  summary: string;
  confidence: number;
  topics: NoticeTopicAnalysis[];
};

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const output = (payload as { output?: unknown[] }).output;
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown[] }).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (
        part &&
        typeof part === "object" &&
        (part as { type?: string }).type === "output_text" &&
        typeof (part as { text?: string }).text === "string"
      ) {
        return (part as { text: string }).text;
      }
    }
  }

  return null;
}

export async function analyzeNoticePdf(fileUrl: string): Promise<NoticeAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada no servidor.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6-terra",
      reasoning: { effort: "low" },
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Analise este edital de concurso público, com foco em cargos de educação. " +
                "Extraia SOMENTE informações explicitamente presentes no PDF. " +
                "Não invente banca, cidade, cargo, datas, quantidade de questões ou pesos. " +
                "Identifique também legislação, conhecimentos pedagógicos, conhecimentos específicos " +
                "e conhecimentos locais/municipais/estaduais quando aparecerem. " +
                "Em source_reference, registre uma referência curta ao trecho/seção/página quando for possível. " +
                "Se um campo não estiver no edital, use string vazia ou 0.",
            },
            {
              type: "input_file",
              file_url: fileUrl,
              filename: "edital.pdf",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "notice_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              board_name: { type: "string" },
              organization_name: { type: "string" },
              city: { type: "string" },
              state: { type: "string" },
              position_name: { type: "string" },
              exam_date: { type: "string" },
              total_questions: { type: "integer" },
              summary: { type: "string" },
              confidence: { type: "number" },
              topics: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    category: { type: "string" },
                    subject: { type: "string" },
                    subtopic: { type: "string" },
                    expected_questions: { type: "integer" },
                    weight: { type: "number" },
                    source_reference: { type: "string" },
                  },
                  required: [
                    "category",
                    "subject",
                    "subtopic",
                    "expected_questions",
                    "weight",
                    "source_reference",
                  ],
                },
              },
            },
            required: [
              "board_name",
              "organization_name",
              "city",
              "state",
              "position_name",
              "exam_date",
              "total_questions",
              "summary",
              "confidence",
              "topics",
            ],
          },
        },
      },
    }),
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      "message" in payload.error
        ? String(payload.error.message)
        : "Falha ao analisar o PDF com IA.";

    throw new Error(message);
  }

  const outputText = extractOutputText(payload);

  if (!outputText) {
    throw new Error("A IA não retornou uma análise estruturada.");
  }

  return JSON.parse(outputText) as NoticeAnalysis;
}
