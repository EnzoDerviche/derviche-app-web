# Derviche Construcciones — Gestión de clientes y presupuestos

App interna (Next.js 16 · App Router · TypeScript · React 19 · Supabase/PostgreSQL · Tailwind 4) para gestionar clientes, presupuestos, items, pagos y PDF.

## Requisitos
- Node 20+ (probado en 24)
- Un proyecto de Supabase

## 1. Instalar
```bash
npm install
```

## 2. Configurar Supabase
1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Copiá `.env.example` a `.env.local` y completá con **Project Settings → API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
   `SUPABASE_SERVICE_ROLE_KEY` es opcional (solo server-side) y hoy no es necesario.
3. Aplicá las migraciones en orden. Dos opciones:
   - **SQL Editor** (más simple): pegá y ejecutá, en orden, el contenido de
     `supabase/migrations/001…005` y luego `supabase/seed.sql` (opcional).
   - **Supabase CLI**:
     ```bash
     supabase link --project-ref <ref>
     supabase db push        # aplica migraciones
     # seed: pegá supabase/seed.sql en el SQL editor, o `supabase db reset` en local
     ```
4. Creá el usuario interno en **Authentication → Users → Add user** (email + password).
   No hay registro público: es una app interna.

## 3. Correr
```bash
npm run dev
```
Abrí http://localhost:3000 → redirige a `/login`.

## Scripts
```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest (lógica de cálculos)
```

## Datos de prueba
- Desde la app: **Configuración → Cargar datos de prueba** (marca los registros como demo;
  "Eliminar datos de prueba" borra solo esos, nunca los reales).
- O ejecutá `supabase/seed.sql`.

## Deploy en Vercel
1. Importá el repo en Vercel.
2. Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (y `SUPABASE_SERVICE_ROLE_KEY` si lo usás, sin prefijo `NEXT_PUBLIC_`).
3. Deploy. El build es serverless-friendly; el PDF se genera on-demand en el runtime Node.

## Estructura
- `src/app/(dashboard)/*` — páginas protegidas (dashboard, clientes, presupuestos, configuración)
- `src/app/login` — auth · `src/middleware.ts` — protección de rutas
- `src/app/api/presupuestos/[id]/pdf` — endpoint PDF
- `src/components` — UI, layout, y componentes por módulo
- `src/lib` — supabase, cálculos, validaciones (Zod), formato, PDF, búsqueda
- `src/app/**/actions.ts` — Server Actions (capa de mutación/negocio)
- `supabase/migrations` + `supabase/seed.sql` — esquema, índices, funciones, triggers, RLS
