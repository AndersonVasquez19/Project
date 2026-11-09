import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Ingresa tu nombre completo.")
      .max(255, "El nombre es demasiado largo."),
    email: z.string().trim().email("Ingresa un correo electrónico válido."),
    password: z
      .string()
      .min(12, "La contraseña debe tener al menos 12 caracteres.")
      .max(72, "La contraseña no puede superar los 72 caracteres."),
    confirmPassword: z.string().min(1, "Confirma tu contraseña."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden.",
  });

export const loginResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
  }),
  access_token: z.string().min(1),
  token_type: z.literal("Bearer"),
  expires_in: z.number().int().positive(),
});

export const apiErrorSchema = z.object({
  message: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginUser = z.infer<typeof loginResponseSchema>["user"];
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;
