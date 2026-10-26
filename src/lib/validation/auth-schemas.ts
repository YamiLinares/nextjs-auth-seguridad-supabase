/**
 * Esquemas de validación compartidos. El servidor SIEMPRE vuelve a validar:
 * la validación del navegador es solo una ayuda de usabilidad.
 */
import { z } from "zod";

export const PASSWORD_MIN = 8;
/** bcrypt (usado por Supabase Auth) solo considera los primeros 72 bytes. */
export const PASSWORD_MAX = 72;
export const DISPLAY_NAME_MAX = 60;

export const PASSWORD_RULES = [
  { id: "length", label: `Entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres`, test: (v: string) => v.length >= PASSWORD_MIN && v.length <= PASSWORD_MAX },
  { id: "lower", label: "Una letra minúscula", test: (v: string) => /[a-z]/.test(v) },
  { id: "upper", label: "Una letra mayúscula", test: (v: string) => /[A-Z]/.test(v) },
  { id: "digit", label: "Un número", test: (v: string) => /\d/.test(v) },
] as const;

const email = z
  .string({ error: "Escribe tu correo electrónico." })
  .trim()
  .toLowerCase()
  .min(1, "Escribe tu correo electrónico.")
  .max(254, "El correo es demasiado largo.")
  .pipe(z.email({ error: "Escribe un correo electrónico válido." }));

const newPassword = z
  .string({ error: "Escribe una contraseña." })
  .superRefine((value, ctx) => {
    const failed = PASSWORD_RULES.filter((rule) => !rule.test(value));
    if (failed.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `La contraseña debe tener: ${failed.map((rule) => rule.label.toLowerCase()).join(", ")}.`,
      });
    }
  });

export const signUpSchema = z
  .object({ email, password: newPassword, confirmPassword: z.string({ error: "Repite la contraseña." }) })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden.",
  });

export const signInSchema = z.object({
  email,
  // En el login no se revela la política: solo se comprueba que exista y su tamaño máximo.
  password: z.string({ error: "Escribe tu contraseña." }).min(1, "Escribe tu contraseña.").max(PASSWORD_MAX * 4, "Contraseña no válida."),
});

export const forgotPasswordSchema = z.object({ email });

export const updatePasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string({ error: "Repite la contraseña." }) })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden.",
  });

export const profileSchema = z.object({
  displayName: z
    .string({ error: "Escribe un nombre." })
    .trim()
    .min(1, "Escribe un nombre.")
    .max(DISPLAY_NAME_MAX, `Máximo ${DISPLAY_NAME_MAX} caracteres.`),
});

/** Convierte FormData en un objeto plano de textos (descarta archivos). */
export function formDataToObject(formData: FormData, keys: readonly string[]): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const key of keys) {
    const value = formData.get(key);
    result[key] = typeof value === "string" ? value : undefined;
  }
  return result;
}
