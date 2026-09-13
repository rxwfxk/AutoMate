import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().min(1, "กรุณากรอกชื่อ").max(100),
  lastName: z.string().min(1, "กรุณากรอกนามสกุล").max(100),
});

export type ProfileInput = z.infer<typeof profileSchema>;
