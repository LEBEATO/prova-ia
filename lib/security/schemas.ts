import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(6).max(128),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

export const uploadNoticeSchema = z.object({
  title: z.string().trim().max(160).optional().default(""),
});

export const createSimulationSchema = z.object({
  noticeId: z.string().uuid(),
  questionCount: z.coerce
    .number()
    .refine((value) => [10, 20, 30].includes(value), "Quantidade inválida"),
  difficultyMode: z.enum([
    "adaptive",
    "beginner",
    "intermediate",
    "advanced",
    "board",
  ]),
});

export const submitSimulationSchema = z.object({
  simulationId: z.string().uuid(),
});

export const noticeAnalysisSchema = z.object({
  board_name: z.string().max(200),
  organization_name: z.string().max(200),
  city: z.string().max(160),
  state: z.string().max(80),
  position_name: z.string().max(200),
  exam_date: z.string().max(20),
  total_questions: z.number().int().min(0).max(1000),
  summary: z.string().max(12000),
  confidence: z.number().min(0).max(1),
  topics: z
    .array(
      z.object({
        category: z.string().max(200),
        subject: z.string().max(200),
        subtopic: z.string().max(300),
        expected_questions: z.number().int().min(0).max(1000),
        weight: z.number().min(0).max(1000),
        source_reference: z.string().max(500),
      })
    )
    .max(300),
});
