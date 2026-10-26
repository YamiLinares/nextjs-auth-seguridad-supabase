#!/usr/bin/env node
/**
 * Pruebas de extremo a extremo de autenticación y seguridad en un navegador real
 * (Edge o Chrome sin interfaz, mediante Chrome DevTools Protocol).
 *
 *   npm run test:e2e -- http://localhost:3000
 *
 * Requiere en .env.local un usuario de prueba YA CONFIRMADO en Supabase:
 *   E2E_TEST_EMAIL, E2E_TEST_PASSWORD
 * Opcional: E2E_SEND_EMAILS=1 para probar registro y recuperación con envío
 * real de correos (los correos llegan a E2E_TEST_EMAIL / E2E_SIGNUP_EMAIL).
 *
 * Nunca imprime contraseñas, cookies ni tokens.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;
const SEND_EMAILS = process.env.E2E_SEND_EMAILS === "1";
const isHttps = BASE.startsWith("https://");
const outputDir = join(process.cwd(), "e2e-output");

if (!EMAIL || !PASSWORD) {
  console.error("Define E2E_TEST_EMAIL y E2E_TEST_PASSWORD en .env.local (usuario de prueba confirmado).");
  process.exit(1);
}

let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}${detail !== "" ? ` — ${detail}` : ""}`);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ----------------------------- Pruebas HTTP ----------------------------- */
console.log("\n# Cabeceras, redirecciones y CSRF (HTTP)");
const home = await fetch(`${BASE}/`, { redirect: "manual" });
const homeAgain = await fetch(`${BASE}/`, { redirect: "manual" });
const csp = home.headers.get("content-security-policy") ?? "";
const nonceOf = (value) => /'nonce-([^']+)'/.exec(value ?? "")?.[1];
check(home.status === 200, "GET / responde 200");
check(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/.test(csp) && csp.includes("frame-ancestors 'none'"), "Content-Security-Policy con nonce y frame-ancestors");
check(nonceOf(csp) !== nonceOf(homeAgain.headers.get("content-security-policy")), "El nonce cambia en cada petición");
// 'unsafe-eval' solo aparece cuando el servidor corre con `next dev`.
const isDevServer = csp.includes("unsafe-eval");
console.log(`INFO servidor en modo ${isDevServer ? "desarrollo" : "producción"}`);
for (const [header, expected] of [
  ["x-content-type-options", "nosniff"],
  ["x-frame-options", "DENY"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
  ["strict-transport-security", "max-age=63072000"],
]) {
  check((home.headers.get(header) ?? "").includes(expected), `Cabecera ${header}`, home.headers.get(header) ?? "ausente");
}
check(home.headers.get("x-powered-by") === null, "Sin cabecera X-Powered-By");

const anonDashboard = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
check(
  [307, 308].includes(anonDashboard.status) && (anonDashboard.headers.get("location") ?? "").includes("/login?next=%2Fdashboard"),
  "Sin sesión, /dashboard redirige a /login",
  `${anonDashboard.status} → ${anonDashboard.headers.get("location")}`,
);

const csrfOrigin = await fetch(`${BASE}/login`, { method: "POST", redirect: "manual", headers: { Origin: "https://evil.example", "Content-Type": "application/x-www-form-urlencoded" }, body: "email=a%40b.co&password=x" });
check(csrfOrigin.status === 403, "POST con Origin de otro sitio → 403", String(csrfOrigin.status));
const csrfFetchSite = await fetch(`${BASE}/login`, { method: "POST", redirect: "manual", headers: { "Sec-Fetch-Site": "cross-site" }, body: "x=1" });
check(csrfFetchSite.status === 403, "POST con Sec-Fetch-Site: cross-site → 403", String(csrfFetchSite.status));

const invalidLink = await fetch(`${BASE}/auth/confirm?token_hash=enlace-falso&type=recovery`, { redirect: "manual" });
check((invalidLink.headers.get("location") ?? "").includes("/auth/error"), "Enlace de verificación inválido → /auth/error", invalidLink.headers.get("location") ?? "");
const updateNoSession = await fetch(`${BASE}/actualizar-password`, { redirect: "manual" });
const updateBody = updateNoSession.status === 200 ? await updateNoSession.text() : "";
check(
  (updateNoSession.headers.get("location") ?? "").includes("/recuperar-password?motivo=enlace") || updateBody.includes("NEXT_REDIRECT") || updateBody.includes("recuperar-password?motivo=enlace"),
  "Sin sesión, /actualizar-password redirige a recuperar",
);

const robots = await (await fetch(`${BASE}/robots.txt`)).text();
const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
check(robots.includes("Disallow: /dashboard") && robots.includes("Sitemap:"), "robots.txt bloquea /dashboard y enlaza el sitemap");
check((sitemap.match(/<loc>/g) ?? []).length === 1 && !/login|registro|dashboard/.test(sitemap), "sitemap.xml solo incluye la página pública");
const loginPage = await fetch(`${BASE}/login`);
check(
  (loginPage.headers.get("x-robots-tag") ?? "").includes("noindex") && (await loginPage.text()).includes('name="robots" content="noindex, nofollow"'),
  "Las páginas de autenticación son noindex (meta y X-Robots-Tag)",
);
const notFound = await fetch(`${BASE}/ruta-que-no-existe`);
check(notFound.status === 404, "Ruta inexistente → 404");

/* ------------------------------ Navegador ------------------------------ */
const browserPath = [
  process.env.BROWSER_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
].find((path) => path && existsSync(path));
if (!browserPath) {
  console.error("No se encontró Edge ni Chrome (define BROWSER_PATH).");
  process.exit(1);
}

const port = 9700 + Math.floor(Math.random() * 200);
const profile = join(tmpdir(), `securegate-e2e-${port}`);
const browser = spawn(browserPath, ["--headless=new", `--remote-debugging-port=${port}`, "--disable-gpu", "--no-first-run", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
let target;
for (let i = 0; i < 60 && !target; i++) {
  await sleep(250);
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
  } catch {
    /* aún no está listo */
  }
}
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener("open", resolve));
let nextId = 0;
const pending = new Map();
const consoleProblems = [];
const documentHeaders = new Map();
socket.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result ?? { error: msg.error });
    pending.delete(msg.id);
  } else if (msg.method === "Runtime.exceptionThrown") {
    consoleProblems.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
  } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
    consoleProblems.push(msg.params.args.map((a) => a.value ?? a.description).join(" "));
  } else if (msg.method === "Log.entryAdded" && ["error"].includes(msg.params.entry.level)) {
    consoleProblems.push(msg.params.entry.text);
  } else if (msg.method === "Network.responseReceived" && msg.params.type === "Document") {
    documentHeaders.set(new URL(msg.params.response.url).pathname, msg.params.response.headers);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });
const js = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
const waitFor = async (expression, timeout = 15000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await js(expression)) return true;
    await sleep(150);
  }
  return false;
};
const go = async (path) => {
  await send("Page.navigate", { url: BASE + path });
  await sleep(300);
  await waitFor(`document.readyState === 'complete'`);
  await sleep(400);
};
const path = () => js(`location.pathname + location.search`);
const fill = (selector, value) =>
  js(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
const submit = (selector = "form") => js(`document.querySelector(${JSON.stringify(selector)}).requestSubmit()`);
const text = () => js(`document.body.innerText`);
const authCookies = async () => ((await send("Network.getCookies", { urls: [BASE] })).cookies ?? []).filter((c) => /^sb-.*-auth-token/.test(c.name));
const shot = async (name, width, height) => {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await sleep(500);
  const full = Math.min(await js(`document.documentElement.scrollHeight`), 3000);
  const overflow = await js(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  check(overflow <= 0, `Sin desbordamiento horizontal: ${name} (${width}px)`, `${overflow}px`);
  const image = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: full, scale: 1 } });
  writeFileSync(join(outputDir, `${name}.png`), Buffer.from(image.data, "base64"));
};
const decodeSession = (cookies) => {
  const sorted = [...cookies].sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  const raw = sorted.map((c) => c.value).join("");
  return JSON.parse(Buffer.from(raw.replace(/^base64-/, ""), "base64url").toString("utf8"));
};

mkdirSync(outputDir, { recursive: true });
await send("Runtime.enable");
await send("Log.enable");
await send("Network.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });

try {
  console.log("\n# Interfaz pública");
  await go("/");
  check((await text()).includes("Tu cuenta, protegida") && (await text()).includes("Iniciar sesión"), "Inicio público con navegación para invitados");
  await shot("inicio-escritorio", 1440, 900);
  await shot("inicio-movil", 375, 812);
  await send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });

  console.log("\n# Validación en el servidor (se desactiva la validación del navegador)");
  await go("/registro");
  await js(`document.querySelectorAll('input').forEach(i => { i.removeAttribute('required'); i.removeAttribute('minlength'); i.type = i.type === 'email' ? 'text' : i.type; }); document.querySelector('form').noValidate = true;`);
  await fill("#field-email", "correo-invalido");
  await fill("#field-password", "debil");
  await fill("#field-confirmPassword", "otra");
  await submit();
  await waitFor(`document.body.innerText.includes('Escribe un correo electrónico válido')`);
  const regText = await text();
  check(regText.includes("Escribe un correo electrónico válido"), "El servidor rechaza un correo con formato inválido");
  check(/La contraseña debe tener/.test(regText), "El servidor rechaza una contraseña que no cumple la política");
  check(regText.includes("Las contraseñas no coinciden"), "El servidor comprueba la confirmación de contraseña");
  check(await js(`document.querySelector('#field-email').getAttribute('aria-invalid') === 'true'`), "Errores accesibles (aria-invalid y aria-describedby)");
  await shot("registro-errores-movil", 375, 900);
  await send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });

  if (SEND_EMAILS) {
    const signupEmail = process.env.E2E_SIGNUP_EMAIL ?? EMAIL.replace("@", `+registro${Date.now()}@`);
    await go("/registro");
    await fill("#field-email", signupEmail);
    await fill("#field-password", "Registro2026");
    await fill("#field-confirmPassword", "Registro2026");
    await submit();
    check(await waitFor(`document.body.innerText.includes('te enviamos un enlace de confirmación')`), "Registro válido: se pide confirmar el correo (sin crear sesión)");
    check((await authCookies()).length === 0, "Tras registrarse sin confirmar no existe sesión");
  } else {
    console.log("INFO registro y recuperación con envío de correo omitidos (E2E_SEND_EMAILS=1 para incluirlos)");
  }

  console.log("\n# Inicio de sesión");
  await go("/login");
  await fill("#field-email", EMAIL);
  await fill("#field-password", `${PASSWORD}-incorrecta`);
  await submit();
  check(await waitFor(`document.body.innerText.includes('Correo o contraseña incorrectos.')`), "Credenciales incorrectas → mensaje genérico");
  check(!(await text()).includes("Invalid login"), "No se muestra el mensaje interno del proveedor");

  await go("/login?next=https%3A%2F%2Fevil.example%2Fphishing");
  await fill("#field-email", EMAIL);
  await fill("#field-password", PASSWORD);
  await submit();
  const loggedIn = await waitFor(`location.pathname === '/dashboard'`);
  check(loggedIn, "Login correcto redirige al dashboard");
  check((await path()) === "/dashboard", "El parámetro next externo se ignora (sin redirección abierta)", await path());
  await waitFor(`document.body.innerText.includes(${JSON.stringify(EMAIL)})`);
  check((await text()).includes(EMAIL), "El dashboard muestra el correo del usuario autenticado");
  check((await text()).includes("Sesión activa") && (await text()).includes("Cerrar sesión"), "La navegación cambia con la sesión");

  console.log("\n# Cookies y almacenamiento del navegador");
  const cookies = await authCookies();
  check(cookies.length > 0, "Existen cookies de sesión de Supabase", `${cookies.length} cookie(s)`);
  check(cookies.every((c) => c.httpOnly), "Todas las cookies de sesión son httpOnly");
  check(cookies.every((c) => c.sameSite === "Lax"), "Todas usan SameSite=Lax");
  check(cookies.every((c) => c.path === "/"), "Path=/");
  const expectSecure = isHttps || !isDevServer;
check(cookies.every((c) => c.secure === expectSecure), expectSecure ? "Atributo Secure activo (modo producción)" : "Secure desactivado en desarrollo sobre http://localhost");
  const maxAgeDays = Math.round((cookies[0].expires - Date.now() / 1000) / 86400);
  check(maxAgeDays >= 6 && maxAgeDays <= 7, "Caducidad de la cookie: 7 días (no 400)", `${maxAgeDays} días`);
  check(!(await js(`document.cookie`)).includes("sb-"), "document.cookie no expone la sesión");
  const storageDump = await js(`JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage })`);
  check(!/sb-|access_token|refresh_token|eyJ/.test(storageDump), "Sin tokens en localStorage ni sessionStorage");
  await go("/dashboard"); // carga completa del documento para leer sus cabeceras reales
  const dashHeaders = documentHeaders.get("/dashboard") ?? {};
  const cacheControl = Object.entries(dashHeaders).find(([k]) => k.toLowerCase() === "cache-control")?.[1] ?? "";
  // no-store impide guardar la respuesta en cualquier caché (Next.js dev envía solo "no-store").
  check(/no-store/.test(cacheControl) && (isDevServer || /private/.test(cacheControl)), "El dashboard no se puede guardar en cachés (Cache-Control)", cacheControl);

  console.log("\n# Rutas para invitados con sesión activa");
  await go("/login");
  check((await path()) === "/dashboard", "Con sesión, /login redirige al dashboard");
  await go("/registro");
  check((await path()) === "/dashboard", "Con sesión, /registro redirige al dashboard");

  console.log("\n# Perfil (Server Action + RLS) y XSS");
  const payload = `<img src=x onerror="window.__xss=1">Ana`;
  await fill("#field-displayName", payload);
  await submit("form:has(#field-displayName)");
  check(await waitFor(`document.body.innerText.includes('Perfil actualizado.')`), "La Server Action actualiza el perfil");
  await go("/dashboard");
  check(
    (await js(`document.querySelector('h1').textContent`)) === payload && (await js(`window.__xss === undefined && !document.querySelector('main img')`)),
    "El contenido del usuario se muestra como texto (no se ejecuta)",
  );
  await fill("#field-displayName", "Usuario de prueba");
  await submit("form:has(#field-displayName)");
  await waitFor(`document.body.innerText.includes('Perfil actualizado.')`);
  await go("/dashboard");
  await shot("dashboard-escritorio", 1440, 900);
  await shot("dashboard-movil", 375, 812);
  await send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });

  console.log("\n# Renovación de sesión");
  const before = await authCookies();
  const session = decodeSession(before);
  session.expires_at = Math.floor(Date.now() / 1000) - 60;
  const forged = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  const baseName = before[0].name.replace(/\.\d+$/, "");
  for (const cookie of before) await send("Network.deleteCookies", { name: cookie.name, url: BASE });
  await send("Network.setCookie", { name: baseName, value: forged, url: BASE, path: "/", httpOnly: true, sameSite: "Lax", secure: before[0].secure });
  await go("/dashboard");
  const after = await authCookies();
  const renewed = after.length > 0 ? decodeSession(after) : null;
  check((await path()) === "/dashboard" && (await text()).includes(EMAIL), "Con el token caducado, la sesión se renueva y el acceso continúa");
  check(renewed !== null && renewed.access_token !== session.access_token && renewed.expires_at > Date.now() / 1000, "Se emitió un nuevo token de acceso");
  check(renewed !== null && renewed.refresh_token !== session.refresh_token, "El refresh token rotó");
  check(after.every((c) => c.httpOnly && c.sameSite === "Lax"), "Las cookies renovadas mantienen httpOnly y SameSite=Lax");

  console.log("\n# Cierre de sesión");
  const sessionBeforeLogout = await authCookies();
  await js(`[...document.querySelectorAll('header form button')].find(b => b.textContent.includes('Cerrar sesión')).click()`);
  check(await waitFor(`location.pathname === '/login'`), "Logout redirige al login");
  check((await text()).includes("Cerraste la sesión correctamente"), "Se confirma el cierre de sesión");
  check((await authCookies()).length === 0, "Las cookies de sesión se eliminaron");
  await go("/dashboard");
  check((await path()).startsWith("/login"), "Después del logout, /dashboard redirige al login");
  for (const cookie of sessionBeforeLogout) {
    await send("Network.setCookie", { name: cookie.name, value: cookie.value, url: BASE, path: "/", httpOnly: true, sameSite: "Lax", secure: cookie.secure });
  }
  await go("/dashboard");
  await waitFor(`location.pathname === '/login'`, 5000);
  check((await path()).startsWith("/login") && !(await text()).includes(EMAIL), "Reutilizar las cookies antiguas no da acceso (sesión revocada en el servidor)", await path());
  check((await authCookies()).length === 0, "Las cookies de la sesión revocada se eliminan");
  await go("/login");
  check((await path()) === "/login" && (await text()).includes("Inicia sesión"), "Sin bucle de redirecciones: /login se muestra con normalidad");
  await send("Network.clearBrowserCookies");

  if (SEND_EMAILS) {
    console.log("\n# Recuperación de contraseña");
    await go("/recuperar-password");
    await fill("#field-email", EMAIL);
    await submit();
    check(await waitFor(`document.body.innerText.includes('Si existe una cuenta con ese correo')`), "Solicitud de recuperación: mensaje sin revelar si la cuenta existe");
  }

  await go("/auth/confirm?token_hash=caducado&type=recovery");
  check((await path()).startsWith("/auth/error") && (await text()).includes("No pudimos verificar este enlace"), "Un enlace inválido o caducado muestra un error claro");
  await shot("enlace-invalido-movil", 375, 812);
  await send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
  await go("/login");
  await shot("login-escritorio", 1440, 900);

  const cspProblems = consoleProblems.filter((m) => /Content Security Policy|Refused to/i.test(m));
  if (isDevServer) {
    // Las herramientas de desarrollo de Next.js inyectan estilos sin nonce; no existen en producción.
    console.log(`INFO modo desarrollo: ${cspProblems.length} aviso(s) de CSP de las herramientas de desarrollo (se verifica en producción)`);
  } else {
    check(cspProblems.length === 0, "Sin violaciones de CSP en la consola", cspProblems.slice(0, 2).join(" | "));
  }
  const otherProblems = consoleProblems.filter((m) => !/Content Security Policy|Refused to|status of 40[34]/i.test(m));
  check(otherProblems.length === 0, "Sin otros errores en la consola", otherProblems.slice(0, 2).join(" | "));
} finally {
  socket.close();
  browser.kill();
  await sleep(500);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* el perfil temporal puede seguir bloqueado en Windows */
  }
}

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} comprobación(es) fallaron.`);
console.log(`Capturas en: ${outputDir}`);
process.exit(failures === 0 ? 0 : 1);
