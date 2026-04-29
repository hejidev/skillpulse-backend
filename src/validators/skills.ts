// validators/skill.ts
import { z } from "zod";

export const createSkillSchema = z.object({
  name: z.string().min(2),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
});