import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Enter your password").max(200, "Password is too long"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export function formDataToLogin(formData: FormData): LoginInput {
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}
