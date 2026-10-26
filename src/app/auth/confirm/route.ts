/**
 * GET /auth/confirm — destino de los enlaces de email de Supabase.
 *
 * Formato recomendado (plantillas de email con token_hash):
 *   /auth/confirm?token_hash=...&type=email      → confirma la cuenta
 *   /auth/confirm?token_hash=...&type=recovery   → permite cambiar la contraseña
 * También acepta ?code=... (flujo PKCE de las plantillas por defecto), que solo
 * funciona en el mismo navegador donde se inició el proceso.
 *
 * verifyOtp / exchangeCodeForSession crean la sesión y escriben las cookies
 * httpOnly en la respuesta. Las redirecciones van solo a rutas internas.
 */
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: readonly EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

function isOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (OTP_TYPES as readonly string[]).includes(value);
}

function destinationFor(type: EmailOtpType | null): string {
  return type === "recovery" ? "/actualizar-password" : "/dashboard?verificado=1";
}

function redirectTo(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const code = params.get("code");
  const supabase = await createClient();

  if (tokenHash && isOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return redirectTo(request, destinationFor(type));
    console.warn("[auth/confirm] verifyOtp falló", { code: error.code, status: error.status });
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return redirectTo(request, destinationFor(isOtpType(type) ? type : null));
    console.warn("[auth/confirm] exchangeCode falló", { code: error.code, status: error.status });
  }

  const reason = params.get("error_code") === "otp_expired" ? "expirado" : "invalido";
  return redirectTo(request, `/auth/error?motivo=${reason}`);
}
