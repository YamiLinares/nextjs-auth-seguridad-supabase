import { AuthApiError, AuthRetryableFetchError, AuthWeakPasswordError } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { authErrorMessage } from "@/lib/auth/errors";
import { EnvError, readSupabaseEnv } from "@/lib/env";
import { profileSchema, signInSchema, signUpSchema, updatePasswordSchema } from "@/lib/validation/auth-schemas";

const VALID = { email: "Ana@Example.com ", password: "Segura123", confirmPassword: "Segura123" };

describe("signUpSchema", () => {
  it("acepta datos válidos y normaliza el correo", () => {
    const result = signUpSchema.safeParse(VALID);
    expect(result.success && result.data.email).toBe("ana@example.com");
  });

  it.each(["", "sin-arroba", "a@", "@dominio.com", "a@b"])("rechaza el correo %j", (email) => {
    const result = signUpSchema.safeParse({ ...VALID, email });
    expect(result.success).toBe(false);
  });

  it.each([
    ["corta", "Ab1"],
    ["sin mayúscula", "segura123"],
    ["sin minúscula", "SEGURA123"],
    ["sin número", "SeguraSegura"],
    ["demasiado larga", `Aa1${"x".repeat(80)}`],
  ])("rechaza una contraseña %s", (_label, password) => {
    const result = signUpSchema.safeParse({ ...VALID, password, confirmPassword: password });
    expect(result.success).toBe(false);
  });

  it("exige que las contraseñas coincidan", () => {
    const result = signUpSchema.safeParse({ ...VALID, confirmPassword: "Otra1234" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  it("rechaza valores ausentes o que no son texto", () => {
    expect(signUpSchema.safeParse({}).success).toBe(false);
    expect(signUpSchema.safeParse({ email: ["a@b.com"], password: 1, confirmPassword: 1 }).success).toBe(false);
  });
});

describe("otros esquemas", () => {
  it("el login no revela la política de contraseñas", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });

  it("valida la nueva contraseña", () => {
    expect(updatePasswordSchema.safeParse({ password: "Nueva1234", confirmPassword: "Nueva1234" }).success).toBe(true);
    expect(updatePasswordSchema.safeParse({ password: "debil", confirmPassword: "debil" }).success).toBe(false);
  });

  it("valida el nombre visible y conserva el texto tal cual (React lo escapa al mostrarlo)", () => {
    const result = profileSchema.safeParse({ displayName: "  <img src=x onerror=alert(1)>  " });
    expect(result.success && result.data.displayName).toBe("<img src=x onerror=alert(1)>");
    expect(profileSchema.safeParse({ displayName: "   " }).success).toBe(false);
    expect(profileSchema.safeParse({ displayName: "x".repeat(61) }).success).toBe(false);
  });
});

describe("authErrorMessage", () => {
  it("usa un mensaje genérico en el login (no revela si la cuenta existe)", () => {
    const error = new AuthApiError("Invalid login credentials", 400, "invalid_credentials");
    expect(authErrorMessage(error, "signIn")).toBe("Correo o contraseña incorrectos.");
  });

  it("informa límites de intentos, errores de red y contraseñas débiles", () => {
    expect(authErrorMessage(new AuthApiError("rate", 429, "over_request_rate_limit"), "signIn")).toMatch(/Demasiados intentos/);
    expect(authErrorMessage(new AuthRetryableFetchError("fetch failed", 0), "signUp")).toMatch(/No se pudo conectar/);
    expect(authErrorMessage(new AuthWeakPasswordError("weak", 422, ["pwned"]), "signUp")).toMatch(/débil/);
  });

  it("nunca devuelve el mensaje interno del proveedor", () => {
    const error = new AuthApiError("Database error saving new user: secret detail", 500, "unexpected_failure");
    const message = authErrorMessage(error, "signUp");
    expect(message).not.toMatch(/Database|secret/);
  });
});

describe("readSupabaseEnv", () => {
  it("lee la URL y la clave publicable", () => {
    expect(
      readSupabaseEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co/", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x" }),
    ).toEqual({ url: "https://abc.supabase.co", publishableKey: "sb_publishable_x" });
  });

  it("rechaza configuraciones incompletas o claves privilegiadas", () => {
    expect(() => readSupabaseEnv({})).toThrow(EnvError);
    expect(() =>
      readSupabaseEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_x" }),
    ).toThrow(/privilegiada/);
  });
});
