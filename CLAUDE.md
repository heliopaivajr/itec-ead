# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Dev server at http://localhost:8080
pnpm build        # Production build
pnpm lint         # ESLint
pnpm tsc --noEmit # Type-check without building
```

**Always use `pnpm`** — this project uses `pnpm-lock.yaml`. Installing with `npm` or `yarn` will break the Vercel build with `ERR_PNPM_OUTDATED_LOCKFILE`.

## Architecture

### Public site vs Dashboard

The app has two distinct areas sharing the same React Router:

- **Public pages** (`/`, `/cursos`, `/sobre`, `/blog`, `/reservar-vaga`, etc.) — marketing/institutional, no auth required
- **Dashboard** (`/dashboard/*`) — protected by `ProtectedRoute` in `App.tsx`, requires Supabase session

`App.tsx` is the single source of truth for all routes. Every page except `Index` is lazy-loaded with `React.lazy()`. Adding a new page requires both creating the file and registering the lazy import + route in `App.tsx`.

### Auth and roles

Auth flows through Supabase. The `useProfile` hook (`src/hooks/use-profile.tsx`) is the canonical way to get the current user — it reads from the `profiles` Supabase table and returns a typed `Profile` with a `UserRole`.

Roles: `aluno` | `professor` | `administracao` | `admin` | `superadmin`

The Dashboard sidebar menu, available routes, and KPIs all change based on role. The mapping lives in `Dashboard.tsx` (`menuByRole` object). Role-check helpers (`isSuperAdmin`, `isAdministracao`, etc.) are exported from `Dashboard.tsx`.

`heliopaiva@gmail.com` is always forced to `superadmin` regardless of the database value — hardcoded in `use-profile.tsx`.

### Supabase

- Client: `src/lib/supabase.ts` — reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`
- Tables currently active: `profiles`, `leads_cursos`, `matriculas`, `avisos`
- Leads from the `/reservar-vaga` form are inserted into `leads_cursos` and appear in Dashboard → Leads

### Theme system

Three themes: `dark` | `light` | `sepia`. Managed by `ThemeProvider` (wraps the whole app in `App.tsx`) and toggled via `ThemeSwitcher` component. CSS variables in `src/index.css` drive all colors — use Tailwind semantic tokens (`bg-background`, `text-foreground`, `text-primary`, `border-border`) not raw colors.

The primary color (`text-primary`, `bg-primary`) is blood red `#ea384c` (also available as `text-itec-bloodRed` / `bg-itec-bloodRed` in Tailwind config).

### Custom Tailwind utilities

Defined in `src/index.css`:
- `container-custom` — centered container with horizontal padding
- `font-merriweather` — serif font for headings
- `animate-pulse-slow`, `animate-glow` — custom keyframe animations

### Static assets

- `public/videos/` — video files served directly (tracked in git, needed for site)
- `public/logo_itec_transparent.png` — logo with transparent background (processed via sharp)
- `/videos/` root folder — source/original videos, **gitignored** (large files)

### VideoReel component

`src/components/VideoReel.tsx` manages 5 vertical Instagram-format videos. The parent component holds refs to all `<video>` elements and controls playback directly — VideoCard children are purely presentational. Do not add `useEffect` playback logic inside VideoCard; route all play/pause/seek through the `playVideo()` function in the parent.

### Hero component

`src/components/Hero.tsx` uses `hero-bg.mp4` as a fullscreen video background with CSS animation classes (`hero-anim-*`) defined inline via a `<style>` tag. A backup of the previous static hero exists as `Hero.backup.tsx`.

### Course data

Static course definitions live in `src/data/courses.ts`. The three courses are: `teologia-livre`, `seteb`, `ministerial-mulheres`. Key facts:
- SETEB: Terças-feiras 19h–20h (not quinta)
- All courses: Modalidade Híbrida (Presencial e Online)
- Turma 2026 starts August 2026

### PRD and documentation

`.prd/prd.md` contains the full project checklist — what's done, what's pending, known bugs, and next steps. Update it when completing significant features.
