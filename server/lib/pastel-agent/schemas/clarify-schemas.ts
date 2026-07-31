import { z } from "zod";

export const clarifyOptionSchema = z.object({
  label: z.string().trim().min(1).max(48),
  description: z.string().trim().min(1).max(140),
});

export const clarifyQuestionSchema = z.object({
  id: z.string().trim().regex(/^[a-z][a-z0-9_]{1,40}$/),
  title: z.string().trim().min(3).max(72),
  question: z.string().trim().min(12).max(220),
  whyItMatters: z.string().trim().min(12).max(180),
  options: z.array(clarifyOptionSchema).min(2).max(4),
  placeholder: z.string().trim().min(3).max(100).optional(),
});

export const clarifyResultSchema = z.object({
  questions: z.array(clarifyQuestionSchema).max(4),
});

export type ClarifyOption = z.infer<typeof clarifyOptionSchema>;
export type ClarifyQuestion = z.infer<typeof clarifyQuestionSchema>;
export type ClarifyResult = z.infer<typeof clarifyResultSchema>;
