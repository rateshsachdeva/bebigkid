import { z } from "zod";
export const childSchema = z
  .object({
    nickname: z.string().max(40),
    age_years: z.number().int().min(0).max(25).nullable(),
    communication: z.string().max(1500),
    sensory: z.string().max(1500),
    interests: z.string().max(1500),
    concerns: z.string().max(1500),
  })
  .strict();
export const noteSchema = z
  .object({
    id: z.string().uuid(),
    text: z.string().trim().min(1).max(4000),
    include_in_ai: z.boolean().optional(),
    source_thread_id: z.string().uuid().nullable().optional(),
    created_at: z.string().optional(),
  })
  .strict();
export const turnSchema = z
  .object({
    threadId: z.string().uuid(),
    requestId: z.string().uuid(),
    message: z.string().trim().min(1).max(8000),
  })
  .strict();
export const configSchema = z
  .object({
    model_id: z.string().min(3).max(150),
    fallback_id: z.string().max(150).nullable().optional(),
    providers: z.array(z.string().min(1).max(60)).min(1).max(4),
    input_rate: z.number().min(0).max(1000),
    output_rate: z.number().min(0).max(1000),
    privacy_reviewed: z.literal(true),
    behaviour_reviewed: z.literal(false),
    output_tokens: z.number().int().min(100).max(1200),
    response_style: z
      .object({
        length: z.enum(["brief", "balanced", "detailed"]),
        max_steps: z.number().int().min(1).max(4),
        clarifying_question: z.boolean(),
        match_language: z.boolean(),
      })
      .strict(),
  })
  .strict();
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  return schema.parse(value);
}
