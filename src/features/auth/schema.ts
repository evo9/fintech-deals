import { z } from "zod";
import { getCountry } from "@/lib/reference";

// bcrypt only looks at the first 72 bytes: longer passwords would be silently truncated.
const MAX_PASSWORD_BYTES = 72;
const passwordLength = (v: string) => new TextEncoder().encode(v).length <= MAX_PASSWORD_BYTES;
const PASSWORD_TOO_LONG = "Password is too long";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Enter your password").refine(passwordLength, PASSWORD_TOO_LONG),
});

export type LoginInput = z.infer<typeof loginSchema>;

export function formDataToLogin(formData: FormData): LoginInput {
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}

// ---------- registration ----------

const emptyToUndefined = (v: string) => (v === "" ? undefined : v);

export const registerSchema = z.object({
  role: z.enum(["BUYER", "SELLER"], { error: "Choose buyer or seller" }), // managers cannot register
  name: z.string().trim().min(1, "Enter your name").max(100, "Name is too long"),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email")
    .max(254, "Email is too long")
    .pipe(z.email("Enter a valid email")),
  password: z.string().min(8, "Use at least 8 characters").refine(passwordLength, PASSWORD_TOO_LONG),
  companyName: z.string().trim().max(120, "Company name is too long").transform(emptyToUndefined),
  country: z
    .string()
    .refine((v) => v === "" || getCountry(v) !== undefined, "Select a country from the list")
    .transform(emptyToUndefined),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export function formDataToRegister(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "");
  return {
    role: get("role"),
    name: get("name"),
    email: get("email"),
    password: get("password"),
    companyName: get("companyName"),
    country: get("country"),
  };
}
