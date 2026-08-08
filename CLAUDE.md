# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

This is the frontend for a Kanban dashboard app: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and `@dnd-kit` for drag-and-drop. It is a standalone repo; a separate sibling repo at `../kanban-backend` (Express + a `db.js` data layer, JWT auth) provides the REST API this app talks to.

## Commands

```bash
npm run dev      # start dev server (http://localhost:3000)
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint (flat config via eslint.config.mjs)
```

There is no test suite configured in this repo (no test runner/scripts in `package.json`).

## Architecture

**API access**: All backend calls go through the single `api()` helper in `lib/api.ts`. It targets `process.env.NEXT_PUBLIC_API_URL` (falls back to `http://localhost:5000`), prefixes every call with `/api`, and attaches `Authorization: Bearer <token>` by reading the JWT from `localStorage.getItem("token")`. There is no other data-fetching layer (no React Query/SWR, no server actions) — pages call `api()` directly from client components. To point at a running backend, set `NEXT_PUBLIC_API_URL` in `.env.local`.

**Auth**: Login/register pages (`app/login`, `app/register`) call `/auth/login` and `/auth/register` and store the returned JWT in `localStorage` under the key `token`. There's no auth context/provider or route guard yet — `app/dashboard` does not check for a token before rendering.

**Routing**: `app/page.tsx` immediately redirects to `/login`. Main routes are `/login`, `/register`, and `/dashboard` (the board itself).

**Kanban board** (`app/dashboard/page.tsx`): owns the single source of truth — a flat `Task[]` array fetched from `GET /tasks` — and derives the three columns (`TODO`, `IN_PROGRESS`, `DONE`) by filtering on `Task.status` (see `types/task.ts`) rather than storing per-column state. Drag-and-drop is wired with `@dnd-kit/core` + `@dnd-kit/sortable`:
- `Column` (`components/kanban/Column.tsx`) is a droppable zone whose `id` is the column's status string (`TODO` / `IN_PROGRESS` / `DONE`), and wraps its tasks in a `SortableContext`.
- `TaskCard` (`components/kanban/TaskCard.tsx`) is the sortable/draggable item, keyed by `task.id`.
- On `DragEnd` in `app/dashboard/page.tsx`, the target column id becomes the task's new `status`; the UI updates optimistically before `PATCH /tasks/:id` fires, and re-fetches from the server on failure to roll back.
- Task creation happens through `CreateTaskModal` (opened per-column with the column's status pre-filled), calling `POST /tasks`.
- Task deletion is only exposed for `TODO` tasks (see the status check in `TaskCard`).

**Theming**: `context/ThemeProvider.tsx` implements dark mode by toggling the `dark` class on `<html>` (Tailwind's class-based dark mode) and persisting the choice to `localStorage` under `theme`, falling back to `prefers-color-scheme`. It intentionally renders children without the context during the first mount to avoid hydration mismatches — `useTheme()` returns a safe no-op default `{ isDark: false, toggleDarkMode: () => {} }` when called outside the provider (it does not throw). `Providers` (`app/providers.tsx`) wraps the whole app in `app/layout.tsx`.

**Styling**: Tailwind utility classes are used throughout, plus a set of hand-written semantic classes in `app/globals.css` (`.kanban-column`, `.task-card`, `.task-title`, `.task-desc`, `.btn-primary`, etc.) with their own `html.dark ...` overrides. When touching kanban board or card visuals, check `globals.css` in addition to inline Tailwind classes — styling for those elements is split across both.

**Path alias**: `@/*` maps to the repo root (see `tsconfig.json`), e.g. `@/lib/api`, `@/components/kanban/Column`, `@/types/task`.

## Notes for changes

- `types/task.ts` (`TaskStatus = "TODO" | "IN_PROGRESS" | "DONE"`) is the single definition of task status and column identity — column titles, droppable ids, and the status filter logic in `app/dashboard/page.tsx` all depend on these three literal strings matching exactly.
- `CreateTaskModal` currently types its props as `any` — check `Column.tsx` for the actual prop shape (`status`, `close`, `refresh`) if modifying it.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
