import { describe, expect, it } from "vitest";
import { SESSION_COOKIE_MAX_AGE, hardenCookieOptions } from "@/lib/security/cookies";
import { buildContentSecurityPolicy, createNonce } from "@/lib/security/csp";
import { checkRequestOrigin } from "@/lib/security/origin";
import { safeRedirectPath } from "@/lib/security/redirect";

describe("safeRedirectPath (redirecciones abiertas)", () => {
  it.each([
    ["/dashboard", "/dashboard"],
    ["/dashboard?tab=perfil", "/dashboard?tab=perfil"],
    ["/dashboard/ajustes", "/dashboard/ajustes"],
  ])("acepta la ruta interna permitida %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it.each([
    "https://evil.example/dashboard",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "/login",
    "/dashboardx",
    "/../dashboard/../admin",
    "",
    undefined,
    42,
    "/" + "a".repeat(300),
  ])("rechaza %j y usa /dashboard", (input) => {
    expect(safeRedirectPath(input)).toBe("/dashboard");
  });
});

describe("checkRequestOrigin (CSRF)", () => {
  const base = { host: "app.example.com", secFetchSite: null, origin: null };

  it("permite métodos seguros desde cualquier origen", () => {
    expect(checkRequestOrigin({ ...base, method: "GET", origin: "https://evil.example" }).allowed).toBe(true);
  });

  it("permite POST del mismo origen", () => {
    expect(checkRequestOrigin({ ...base, method: "POST", origin: "https://app.example.com", secFetchSite: "same-origin" }).allowed).toBe(true);
  });

  it.each([
    ["Origin de otro dominio", { origin: "https://evil.example" }],
    ["Origin con otro puerto", { origin: "https://app.example.com:8443" }],
    ["Origin null (iframe sandbox)", { origin: "null" }],
    ["Origin inválido", { origin: "nada" }],
    ["Sec-Fetch-Site cross-site", { secFetchSite: "cross-site" }],
  ])("rechaza POST con %s", (_label, overrides) => {
    expect(checkRequestOrigin({ ...base, method: "POST", ...overrides }).allowed).toBe(false);
  });

  it("permite clientes no navegador sin Origin (no transportan cookies de una víctima)", () => {
    expect(checkRequestOrigin({ ...base, method: "POST" }).allowed).toBe(true);
  });
});

describe("hardenCookieOptions", () => {
  it("fuerza httpOnly, SameSite=Lax, path y una duración propia", () => {
    expect(hardenCookieOptions({ httpOnly: false, sameSite: "none", maxAge: 400 * 24 * 3600, path: "/x" }, false)).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: SESSION_COOKIE_MAX_AGE,
    });
  });

  it("activa Secure en producción", () => {
    expect(hardenCookieOptions({}, true).secure).toBe(true);
  });

  it("conserva el borrado de cookies (maxAge 0)", () => {
    expect(hardenCookieOptions({ maxAge: 0 }, true).maxAge).toBe(0);
  });
});

describe("Content-Security-Policy", () => {
  it("genera nonces distintos y una política estricta en producción", () => {
    const nonce = createNonce();
    expect(nonce).not.toBe(createNonce());
    const csp = buildContentSecurityPolicy(nonce, false);
    expect(csp).toContain(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
  });

  it("solo permite unsafe-eval en desarrollo", () => {
    expect(buildContentSecurityPolicy("abc", true)).toContain("'unsafe-eval'");
  });
});
