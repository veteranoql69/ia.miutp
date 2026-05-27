# Stack Tecnológico — miUTP

## Descripción general

miUTP es una plataforma educativa con IA para escuelas chilenas, enfocada en análisis SIMCE y evaluación de aprendizajes. Está construida con un enfoque full-stack moderno y despliegue containerizado on-premise.

---

## Framework y lenguaje

| Tecnología | Versión | Rol |
|---|---|---|
| Next.js | 14.2.35 | Framework principal (App Router) |
| React | 18 | UI rendering |
| TypeScript | 5 | Lenguaje base (strict mode) |
| Node.js | 20 (Alpine) | Runtime de producción |

---

## Frontend y estilos

| Tecnología | Versión | Rol |
|---|---|---|
| Tailwind CSS | 3.4.1 | Estilos utilitarios |
| PostCSS | 8 | Procesamiento de CSS |
| Lucide React | 1.16.0 | Iconos |

Configuración: CSS custom properties para theming, soporte de variables CSS en Tailwind.

---

## Backend y API

- **Server Actions** de Next.js para mutaciones de datos (sin API routes separadas)
- **Zod** 4.4.3 para validación de esquemas en servidor y cliente
- Límite de body en Server Actions: **50 MB** (configurado en `next.config.mjs`)

---

## Base de datos y autenticación

| Tecnología | Versión | Rol |
|---|---|---|
| Supabase (PostgreSQL) | — | Base de datos principal |
| @supabase/ssr | 0.10.3 | Cliente server-side (cookies) |
| @supabase/supabase-js | 2.106.2 | Cliente browser |

**Supabase provee:**
- PostgreSQL con Row Level Security (RLS) para aislamiento multi-tenant
- Auth: Google OAuth + email/password
- Storage: PDFs, imágenes escaneadas, reportes
- Realtime: notificaciones de subida de archivos

Los tipos de la base de datos se generan automáticamente en `src/types/database.types.ts`.

---

## IA y LLM

| Tecnología | Versión | Rol |
|---|---|---|
| Vercel AI SDK | 6.0.191 | Orquestación de IA |
| @ai-sdk/google | 3.0.79 | Conector Gemini |
| Langfuse | 3.38.20 | Observabilidad y trazas de LLM |

**Modelos utilizados:**
- `gemini-2.5-flash` — visión, inferencia rápida, bajo costo
- `gemini-1.5-pro` — razonamiento avanzado y alineación curricular

**Patrón de uso:** `generateObject` del AI SDK con esquemas Zod para output estructurado.

**Langfuse:** registra prompts, outputs, tokens usados y latencia en instancia local. Helper centralizado en [src/lib/langfuse.ts](../src/lib/langfuse.ts).

---

## Procesamiento de archivos

| Tecnología | Versión | Rol |
|---|---|---|
| Stirling-PDF API | — | Conversión PDF → imagen, OCR |
| ExcelJS | 4.4.0 | Generación de planillas Excel |
| XLSX | 0.18.5 | Lectura/escritura de archivos Excel |

Stirling-PDF corre como servicio Docker separado en la misma red interna.

---

## Infraestructura y despliegue

| Tecnología | Rol |
|---|---|
| Docker (multi-stage) | Build y empaquetado |
| Docker Swarm | Orquestación en producción |
| Docker Compose (v3.7) | Definición del stack |
| Traefik | Reverse proxy + HTTPS (Let's Encrypt) |
| GitHub Container Registry | Registro de imágenes (`ghcr.io/veteranoql69/ia.miutp`) |

**Dominio:** `miutp.sditecnologia.cl`

**Red compartida:** `DesaNet` (compartida con otros servicios de SDI Tecnología)

**Recursos del contenedor:** 1 CPU, 1024 MB RAM

**Output de build:** `standalone` — bundle Node.js ligero sin dependencias completas de `node_modules`.

**Seguridad del contenedor:** usuario no-root `nextjs:nodejs`.

---

## Variables de entorno requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini
GEMINI_API_KEY=

# Langfuse
NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=

# Stirling PDF
STIRLING_PDF_API_URL=
STIRLING_PDF_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=
PORT=
```

---

## Herramientas de desarrollo

| Herramienta | Versión | Rol |
|---|---|---|
| ESLint | 8 | Linting (config Next.js) |
| TypeScript | 5 | Type checking |
| npm | — | Gestor de paquetes |

---

## Estructura del proyecto

```
src/
├── app/              # Next.js App Router (páginas, layouts, auth callback)
├── lib/              # Utilidades core (Supabase, Langfuse)
├── modules/
│   ├── colegio/      # Onboarding y gestión de datos del colegio
│   ├── analitica/    # Dashboards analíticos y KPIs
│   ├── evaluacion/   # Lógica de evaluaciones
│   ├── procesamiento/# Flujos de procesamiento de archivos
│   └── ai-agent/     # Integración Gemini y recomendaciones
├── types/            # Tipos TypeScript (schema auto-generado de Supabase)
└── utils/            # Helpers (cliente Supabase browser)
supabase/             # Configuración instancia Supabase local
doc/                  # Documentación del proyecto
```

---

## Flujo de datos simplificado

```
Usuario (browser)
  └─→ Next.js App Router (Server Actions)
        ├─→ Supabase (auth + DB + storage)
        ├─→ Gemini API (via Vercel AI SDK)
        │     └─→ Langfuse (observabilidad)
        └─→ Stirling-PDF (procesamiento de documentos)
```

---

## Usuarios objetivo

- Jefes de UTP
- Profesores jefe
- Jefes de asignatura

**Alcance:** colegios chilenos con análisis SIMCE y seguimiento de aprendizajes.
