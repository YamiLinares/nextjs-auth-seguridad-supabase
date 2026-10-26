# SecureGate — Autenticación segura con cookies httpOnly

Aplicación de demostración de autenticación profesional con **Next.js 16 (App Router)**, **Supabase Auth** y **TypeScript estricto**. La sesión se guarda en **cookies httpOnly** que JavaScript no puede leer. Cada acceso a datos privados se verifica en el servidor. Incluye defensas contra CSRF y XSS, cabeceras de seguridad y SEO técnico.

- **Repositorio:** https://github.com/YamiLinares/nextjs-auth-seguridad-supabase
- **Producción:** https://nextjs-auth-seguridad-supabase.vercel.app

## Objetivos de la actividad

*Implementar capas de seguridad a nivel de servidor y estrategias de posicionamiento orgánico para aplicaciones web profesionales.* Práctica: **Seguridad de autenticación con cookies httpOnly en Next.js**.

- Registro, inicio y cierre de sesión, recuperación de contraseña y verificación de email con Supabase Auth.
- Sesión en cookies httpOnly, SameSite=Lax y Secure en producción, con renovación y rotación de tokens.
- Rutas privadas protegidas en el servidor y Server Actions que validan y autorizan cada operación.
- Medidas contra XSS y CSRF, cabeceras de seguridad y CSP con nonce.
- SEO técnico: metadatos, Open Graph, `robots.txt`, `sitemap.xml` y `noindex` en las páginas privadas.

## Tecnologías

| Tecnología | Versión |
| --- | --- |
| Next.js (App Router, Turbopack) | 16.4.3 |
| React | 19.3.0 |
| TypeScript (`strict`) | 5.9.3 |
| `@supabase/ssr` | 0.12.7 |
| `@supabase/supabase-js` | 2.118.0 |
| Zod (validación) | 4.6.7 |
| Tailwind CSS | 4.3.3 |
| Vitest | 5.0.5 |
| Vercel (despliegue) | — |

## Arquitectura

```text
Navegador ──POST (Server Action)──▶ Next.js (servidor) ──▶ Supabase Auth / PostgreSQL (RLS)
    ▲                                      │
    └──── Set-Cookie: sb-…-auth-token; HttpOnly; Secure; SameSite=Lax ◀┘
```

1. **`src/proxy.ts`**, que se ejecuta antes de cada página:
   - rechaza peticiones mutables de otro origen;
   - genera el nonce de la CSP;
   - renueva la sesión con `getClaims()`;
   - en `/dashboard`, `/login` y `/registro` verifica con `getUser()` y redirige según corresponda.
2. **Server Actions** (`src/actions/`): registro, login, logout, recuperación, nueva contraseña y perfil. Validan con Zod y verifican la sesión en el servidor.
3. **DAL** (`src/lib/auth/dal.ts`): `getVerifiedUser()` usa `getUser()`, que consulta a Supabase Auth y detecta sesiones revocadas. Es la base para entregar datos privados.
4. **`/auth/confirm`** (Route Handler): procesa los enlaces de los correos (`token_hash` o `code`) y crea la sesión.
5. **Base de datos:** tabla `profiles` con RLS. Cada usuario solo accede a su fila.

**Decisión clave.** `@supabase/ssr` escribe por defecto sus cookies con `httpOnly: false`, para que su cliente de navegador pueda leerlas, y con una duración de 400 días. Esta aplicación **no usa el cliente de Supabase en el navegador**: todo pasa por el servidor. Por eso fuerza `httpOnly: true` y una duración de 7 días en `src/lib/security/cookies.ts`. No hay dos sistemas de sesión: el navegador nunca ve los tokens.

## Estructura

```text
src/
├── proxy.ts                         # CSRF (origen), CSP con nonce, renovación de sesión y redirecciones
├── actions/
│   ├── auth-actions.ts              # signUp, signIn, signOut, reset y update password
│   └── profile-actions.ts           # actualización del perfil (con RLS)
├── app/
│   ├── layout.tsx · page.tsx        # layout, metadatos e inicio público
│   ├── (auth)/                      # login, registro, recuperar-password, actualizar-password (noindex)
│   ├── (protected)/dashboard/       # panel privado (verifica la sesión en el servidor)
│   ├── auth/confirm/route.ts        # callback de los enlaces de email
│   ├── auth/error/page.tsx          # enlaces inválidos o caducados
│   ├── robots.ts · sitemap.ts · icon.svg
│   └── error.tsx · not-found.tsx
├── components/{auth,dashboard,layout,ui}/
├── lib/
│   ├── supabase/server.ts           # cliente para Server Components, Actions y Route Handlers
│   ├── supabase/proxy.ts            # cliente para proxy.ts (renovación y verificación)
│   ├── auth/dal.ts · auth/errors.ts # verificación de usuario y mensajes seguros
│   ├── security/                    # cookies, csp, origin (CSRF), redirect (redirecciones abiertas)
│   ├── validation/auth-schemas.ts   # esquemas Zod compartidos
│   └── env.ts
└── types/
supabase/migrations/001_create_profiles.sql
scripts/e2e-auth.mjs                 # pruebas de extremo a extremo en navegador real
tests/                               # pruebas unitarias (Vitest)
```

## Requisitos previos

- Node.js 20.9 o superior (probado con Node.js 24.16) y npm.
- Una cuenta de Supabase y otra de Vercel.
- Opcional, para `npm run test:e2e`: Microsoft Edge o Google Chrome.

## Instalación local (Windows PowerShell)

```powershell
git clone https://github.com/YamiLinares/nextjs-auth-seguridad-supabase.git
cd nextjs-auth-seguridad-supabase
npm install
Copy-Item .env.example .env.local
code .env.local
```

## Variables de entorno

| Variable | Tipo | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL del proyecto (Project Settings → Data API). Sin `/rest/v1/` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Pública | Clave publicable `sb_publishable_…` (Project Settings → API Keys) |
| `NEXT_PUBLIC_SITE_URL` | Pública | URL del sitio, para los enlaces de los correos y los metadatos |
| `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` | **Privadas, solo local** | Usuario de prueba para `npm run test:e2e`. No se configuran en Vercel |

La URL y la clave publicable pueden ser públicas porque la seguridad depende de RLS y de permisos mínimos. **Nunca** uses la clave `service_role` ni una `sb_secret_…`: la aplicación no la necesita y la rechaza si se configura por error. `.env.local` está en `.gitignore` y `.vercelignore`.

## Configuración de Supabase

1. Crea un proyecto en https://supabase.com/dashboard.
2. En **SQL Editor**, ejecuta `supabase/migrations/001_create_profiles.sql`. Crea:
   - la tabla `profiles` con RLS;
   - políticas para que cada usuario solo lea y actualice su propia fila (`auth.uid() = id`);
   - permisos mínimos: `anon` sin acceso, y `authenticated` solo con `select` y con `update (display_name)`;
   - un trigger que crea el perfil al registrarse.
3. En **Authentication → URL Configuration**:
   - **Site URL:** `https://nextjs-auth-seguridad-supabase.vercel.app` (o `http://localhost:3000` en local).
   - **Redirect URLs:** `http://localhost:3000/**` y `https://nextjs-auth-seguridad-supabase.vercel.app/**`.
4. **Confirmación de email:** está activada por defecto (Authentication → Sign In / Providers → Email → *Confirm email*).
5. Recomendado: en el mismo apartado de Email, fija la longitud mínima de contraseña en 8 para alinearla con la política de la app.

### Correos y callbacks

La app envía los enlaces a `/auth/confirm`, mediante `emailRedirectTo` y `redirectTo`. Hay 2 formatos posibles:

- **Recomendado (`token_hash`).** Funciona aunque el enlace se abra en otro navegador o en el móvil. En **Authentication → Emails → Templates**, cambia el enlace de las plantillas:
  - *Confirm signup:* `<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Confirmar mi correo</a>`
  - *Reset Password:* `<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">Crear una contraseña nueva</a>`
- **Plantillas por defecto (`code`, PKCE).** También funcionan, pero el enlace debe abrirse **en el mismo navegador** donde se hizo el registro o la solicitud, porque el verificador PKCE vive en una cookie httpOnly de ese navegador.

Los enlaces inválidos, usados o caducados llevan a `/auth/error`. La recuperación crea una sesión temporal que permite entrar en `/actualizar-password`. Al guardar la contraseña nueva, se cierran las demás sesiones.

El correo integrado de Supabase tiene un límite bajo de envíos por hora. Para producción real conviene configurar un SMTP propio en Authentication → Emails → SMTP Settings.

## Ejecución

```powershell
npm run dev          # http://localhost:3000
npm run build        # compilación de producción
npm run start        # sirve la compilación (http://localhost:3000)
```

## Pruebas

```powershell
npm run typecheck    # tipos de rutas de Next.js + TypeScript estricto
npm run lint         # ESLint
npm test             # pruebas unitarias
npm run verify       # typecheck + lint + test + build
npm run test:e2e -- http://localhost:3000                              # contra local (con la app en marcha)
npm run test:e2e -- https://nextjs-auth-seguridad-supabase.vercel.app  # contra producción
```

`test:e2e` necesita `E2E_TEST_EMAIL` y `E2E_TEST_PASSWORD` de un usuario **confirmado**: créalo en Authentication → Users → Add user → *Auto Confirm User*. Con `E2E_SEND_EMAILS=1` incluye el registro y la recuperación, lo que envía correos reales. El script nunca imprime contraseñas, cookies ni tokens.

### Resultados verificados

- **TypeScript y ESLint:** sin errores.
- **Pruebas unitarias:** 49 de 49. Cubren:
  - redirecciones abiertas;
  - comprobación de origen (CSRF);
  - endurecimiento de cookies;
  - CSP;
  - esquemas de validación;
  - mensajes de error seguros;
  - variables de entorno.
- **Compilación de producción:** correcta.
- **`test:e2e`:** 62 de 62 comprobaciones aprobadas contra `next start` local y **contra producción en Vercel (HTTPS)**:
  - cabeceras (CSP con nonce distinto en cada petición, HSTS, X-Frame-Options, nosniff, Referrer-Policy, sin X-Powered-By);
  - `/dashboard` sin sesión → `/login`;
  - POST de otro origen y `Sec-Fetch-Site: cross-site` → 403;
  - validación en el servidor con la del navegador desactivada;
  - credenciales incorrectas → mensaje genérico;
  - login correcto y redirección al dashboard; un `next` externo se ignora;
  - cookies `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` en producción y duración de 7 días;
  - `document.cookie`, `localStorage` y `sessionStorage` sin tokens;
  - el dashboard nunca se guarda en caché (`no-store`);
  - `/login` y `/registro` con sesión → dashboard;
  - perfil actualizado por Server Action con RLS;
  - una carga XSS se muestra como texto;
  - **renovación de sesión:** con el token caducado se emite uno nuevo y el refresh token rota;
  - **logout:** borra las cookies, y reutilizar las cookies antiguas no da acceso porque la sesión está revocada en el servidor;
  - enlaces inválidos → `/auth/error`;
  - sin violaciones de CSP ni errores en la consola;
  - sin desbordamiento horizontal a 375 y 1440 px.
- **Error de red:** con una URL de Supabase inalcanzable, el login muestra «No se pudo conectar con el servicio de autenticación…» sin detalles internos (prueba manual en `next dev`).
- **Correos reales, verificación manual en producción:** registro con confirmación de email y recuperación de contraseña completados desde el navegador de la autora con una cuenta de prueba.
  - En el primer intento, Supabase alcanzó su límite de envíos por hora; la app mostró «Demasiados intentos. Espera unos minutos…», sin detalles internos.
  - Tras esperar, ambos flujos funcionaron.

## Cookies y gestión de la sesión

| Atributo | Valor | Motivo |
| --- | --- | --- |
| `HttpOnly` | Sí | Un script, incluido un XSS, no puede leer los tokens |
| `Secure` | Sí en producción | Solo viajan por HTTPS (en `next dev` sobre http no se puede) |
| `SameSite` | `Lax` | No se envían en peticiones POST de otros sitios; sí al llegar desde un enlace de email |
| `Path` | `/` | Disponible para toda la aplicación |
| `Max-Age` | 7 días | Se renueva con la actividad; antes eran 400 días por defecto |

- **Renovación:** en cada petición, `proxy.ts` llama a `getClaims()`. Si el token de acceso caducó (1 h), Supabase lo renueva con el refresh token, que rota, y las cookies nuevas se escriben en la petición y en la respuesta. Las respuestas que escriben cookies llevan `Cache-Control: private, no-store`.
- **Verificación:** `getClaims()` solo valida la firma localmente. Para entregar datos o autorizar operaciones se usa `getUser()`, que detecta sesiones cerradas o revocadas.
- **Logout:** Server Action por POST. `signOut()` revoca la sesión en Supabase y borra las cookies. El dashboard ofrece además «Cerrar sesión en todos los dispositivos» (`scope: "global"`).

## Protección contra CSRF

- Las mutaciones solo van por POST, a través de Server Actions. Next.js compara `Origin` con `Host` y rechaza las que no coinciden.
- `proxy.ts` añade una comprobación propia para **toda** petición mutable: rechaza con 403 un `Origin` distinto, `Origin: null` o `Sec-Fetch-Site: cross-site`.
- Las cookies `SameSite=Lax` no viajan en POST iniciados por otros sitios.
- El logout no es un enlace GET.
- Los destinos de redirección se validan (`safeRedirectPath`): solo rutas internas permitidas.
- No se añadió un token CSRF propio: con Server Actions, comprobación de origen y SameSite no aporta una protección comprobable adicional.
- **Relación con XSS:** un XSS se ejecuta en el mismo origen y podría saltarse estas defensas enviando peticiones legítimas. Por eso también se mitiga XSS.

## Protección contra XSS

- React escapa todo el contenido; no se usa `dangerouslySetInnerHTML`. Una prueba guarda `<img src=x onerror=…>` como nombre y se muestra como texto.
- Content-Security-Policy con **nonce por petición** y `'strict-dynamic'`:
  - sin `'unsafe-inline'` para scripts;
  - `'unsafe-eval'` solo en desarrollo;
  - `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`;
  - `connect-src 'self'`, porque el navegador nunca habla con Supabase.
- Ningún token en `localStorage` ni `sessionStorage`, y cookies httpOnly.
- Los errores y logs nunca incluyen contraseñas, tokens ni mensajes internos del proveedor.
- **Limitación:** ninguna medida hace la aplicación «inmune» a XSS. La CSP reduce el impacto.

## Cabeceras de seguridad

Configuradas en `next.config.ts`, salvo la CSP, que va en `proxy.ts`. Verificadas en la respuesta real de producción:

- `Content-Security-Policy` (con nonce)
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy: same-origin`
- sin `X-Powered-By`.

## Protección de rutas y Server Actions

| Recurso | Comprobaciones |
| --- | --- |
| `/dashboard` | `proxy.ts` (verificación con `getUser`) + `requireUser()` en la página |
| `/actualizar-password` | `getVerifiedUser()` en la página y de nuevo en la Server Action |
| `updateProfileAction` | `getVerifiedUser()` + RLS (`auth.uid() = id`); el id nunca viene del formulario |
| `signIn` / `signUp` / reset | Validación Zod en el servidor y mensajes que no revelan si una cuenta existe |

Todas las páginas se renderizan dinámicamente: leen la sesión y usan un nonce por petición. Las respuestas privadas no se guardan en cachés compartidas.

## SEO técnico

- Metadatos `title` (con plantilla) y `description`, Open Graph y Twitter Card.
- `lang="es"` y `metadataBase` desde `NEXT_PUBLIC_SITE_URL`.
- URL canónica solo cuando el sitio usa un dominio HTTPS (producción).
- `robots.txt`: bloquea `/dashboard`, `/auth/` y `/actualizar-password`, y enlaza el sitemap.
- `sitemap.xml`: solo incluye la página pública de inicio.
- `noindex, nofollow` (meta y `X-Robots-Tag`) en login, registro, recuperación y panel. Login y registro no se bloquean en `robots.txt`, para que los buscadores puedan leer su `noindex`.
- HTML semántico con un solo `h1` por página, icono SVG y diseño responsive.

Estas medidas mejoran la base técnica, pero **no garantizan** posiciones en buscadores.

## Despliegue en Vercel

1. Importa el repositorio en Vercel, que detecta Next.js automáticamente.
2. Configura las variables en **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Production, Preview y Development);
   - `NEXT_PUBLIC_SITE_URL` con la URL de producción.
3. Despliega. Cada `git push` a `main` despliega de nuevo.
4. En Supabase, añade la URL de producción a *Site URL* y *Redirect URLs* (ver arriba).

Con Vercel CLI:

```powershell
npx vercel link
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
npx vercel env add NEXT_PUBLIC_SITE_URL production
npx vercel deploy --prod
```

## Limitaciones conocidas

- Un token de acceso firmado sigue siendo **criptográficamente** válido hasta que caduca (1 h), aunque la sesión se cierre. La app no confía solo en la firma para datos privados: usa `getUser()`, que comprueba la sesión en Supabase.
- Los enlaces de email con plantillas por defecto (PKCE) solo funcionan en el navegador donde se inició el flujo. Las plantillas `token_hash` lo evitan.
- Algunos filtros antispam abren los enlaces de los correos de forma automática y pueden consumirlos antes que el usuario.
- El correo integrado de Supabase limita los envíos por hora. Para un uso real se necesita SMTP propio.
- En `next dev`, las herramientas de desarrollo de Next.js generan avisos de CSP por estilos sin nonce. No existen en producción, donde no hay violaciones.
- La limitación de intentos de login depende de los límites de Supabase Auth; la app no añade un limitador propio.
