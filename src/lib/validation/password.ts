import { z } from "zod";

export const passwordRequirements = [
  { id: "length", label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { id: "uppercase", label: "One uppercase character", test: (value: string) => /[A-Z]/.test(value) },
  { id: "lowercase", label: "One lowercase character", test: (value: string) => /[a-z]/.test(value) },
  { id: "number", label: "One number", test: (value: string) => /\d/.test(value) },
  { id: "special", label: "One special character", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Z]/, "Add an uppercase character")
  .regex(/[a-z]/, "Add a lowercase character")
  .regex(/\d/, "Add a number")
  .regex(/[^A-Za-z0-9]/, "Add a special character");
