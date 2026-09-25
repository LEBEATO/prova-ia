type SafeParseSuccess<T> = { success: true; data: T };
type SafeParseFailure = { success: false; error: Error };
type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure;

type Schema<T> = {
  safeParse(value: unknown): SafeParseResult<T>;
  parse(value: unknown): T;
};

function schema<T>(validator: (value: unknown) => T): Schema<T> {
  return {
    safeParse(value) {
      try {
        return { success: true, data: validator(value) };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Invalid value"),
        };
      }
    },
    parse(value) {
      return validator(value);
    },
  };
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected object");
  }
  return value as Record<string, unknown>;
}

function stringValue(
  value: unknown,
  options: { min?: number; max: number; trim?: boolean } = { max: 1000 }
) {
  if (typeof value !== "string") throw new Error("Expected string");
  const parsed = options.trim ? value.trim() : value;
  if (options.min !== undefined && parsed.length < options.min) {
    throw new Error("String too short");
  }
  if (parsed.length > options.max) throw new Error("String too long");
  return parsed;
}

function numberValue(
  value: unknown,
  options: { min: number; max: number; integer?: boolean }
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("Expected number");
  }
  if (options.integer && !Number.isInteger(value)) {
    throw new Error("Expected integer");
  }
  if (value < options.min || value > options.max) {
    throw new Error("Number out of range");
  }
  return value;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const uuidSchema = schema<string>((value) => {
  const parsed = stringValue(value, { min: 36, max: 36, trim: true });
  if (!UUID_RE.test(parsed)) throw new Error("Invalid UUID");
  return parsed;
});

export const loginSchema = schema<{ email: string; password: string }>((value) => {
  const data = object(value);
  const email = stringValue(data.email, { min: 3, max: 254, trim: true }).toLowerCase();
  const password = stringValue(data.password, { min: 6, max: 128 });
  if (!EMAIL_RE.test(email)) throw new Error("Invalid email");
  return { email, password };
});

export const signupSchema = schema<{
  fullName: string;
  email: string;
  password: string;
}>((value) => {
  const data = object(value);
  const fullName = stringValue(data.fullName, { min: 2, max: 120, trim: true });
  const email = stringValue(data.email, { min: 3, max: 254, trim: true }).toLowerCase();
  const password = stringValue(data.password, { min: 8, max: 128 });
  if (!EMAIL_RE.test(email)) throw new Error("Invalid email");
  return { fullName, email, password };
});

export const uploadNoticeSchema = schema<{ title: string }>((value) => {
  const data = object(value);
  const rawTitle = data.title ?? "";
  const title = stringValue(rawTitle, { max: 160, trim: true });
  return { title };
});

const DIFFICULTY_MODES = [
  "adaptive",
  "beginner",
  "intermediate",
  "advanced",
  "board",
] as const;

export const createSimulationSchema = schema<{
  noticeId: string;
  questionCount: number;
  difficultyMode: (typeof DIFFICULTY_MODES)[number];
}>((value) => {
  const data = object(value);
  const noticeId = uuidSchema.parse(data.noticeId);
  const questionCount = Number(data.questionCount);
  if (![10, 20, 30].includes(questionCount)) {
    throw new Error("Invalid question count");
  }

  const difficultyMode = stringValue(data.difficultyMode, {
    min: 1,
    max: 20,
    trim: true,
  });

  if (!DIFFICULTY_MODES.includes(difficultyMode as (typeof DIFFICULTY_MODES)[number])) {
    throw new Error("Invalid difficulty mode");
  }

  return {
    noticeId,
    questionCount,
    difficultyMode: difficultyMode as (typeof DIFFICULTY_MODES)[number],
  };
});

export const submitSimulationSchema = schema<{ simulationId: string }>((value) => {
  const data = object(value);
  return { simulationId: uuidSchema.parse(data.simulationId) };
});

export type NoticeAnalysisValidated = {
  board_name: string;
  organization_name: string;
  city: string;
  state: string;
  position_name: string;
  exam_date: string;
  total_questions: number;
  summary: string;
  confidence: number;
  topics: Array<{
    category: string;
    subject: string;
    subtopic: string;
    expected_questions: number;
    weight: number;
    source_reference: string;
  }>;
};

export const noticeAnalysisSchema = schema<NoticeAnalysisValidated>((value) => {
  const data = object(value);
  if (!Array.isArray(data.topics) || data.topics.length > 300) {
    throw new Error("Invalid topics");
  }

  return {
    board_name: stringValue(data.board_name, { max: 200 }),
    organization_name: stringValue(data.organization_name, { max: 200 }),
    city: stringValue(data.city, { max: 160 }),
    state: stringValue(data.state, { max: 80 }),
    position_name: stringValue(data.position_name, { max: 200 }),
    exam_date: stringValue(data.exam_date, { max: 20 }),
    total_questions: numberValue(data.total_questions, {
      min: 0,
      max: 1000,
      integer: true,
    }),
    summary: stringValue(data.summary, { max: 12000 }),
    confidence: numberValue(data.confidence, { min: 0, max: 1 }),
    topics: data.topics.map((topic) => {
      const item = object(topic);
      return {
        category: stringValue(item.category, { max: 200 }),
        subject: stringValue(item.subject, { max: 200 }),
        subtopic: stringValue(item.subtopic, { max: 300 }),
        expected_questions: numberValue(item.expected_questions, {
          min: 0,
          max: 1000,
          integer: true,
        }),
        weight: numberValue(item.weight, { min: 0, max: 1000 }),
        source_reference: stringValue(item.source_reference, { max: 500 }),
      };
    }),
  };
});
