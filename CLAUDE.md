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

**API access**: All backend calls go through the single `api()` helper in `lib/api.ts`. It targets `process.env.NEXT_PUBLIC_API_URL` (falls back to `http://localhost:5000`), prefixes every call with `/api`, and attaches `Authorization: Bearer <token>` by reading the JWT from `localStorage.getItem("token")`. There is no other data-fetching layer (no React Query/SWR, no server actions) — pages call `api()` directly from client components. To point at a running backend, set `NEXT_PUBLIC_API_URL` in `.env.local`. On a non-2xx response it throws `ApiError` (also exported from `lib/api.ts`), which extends `Error` but also carries `status` (HTTP status code) and `data` (the parsed JSON error body) — use `err instanceof ApiError && err.status === 404` etc. when a page needs to branch on the specific error shape (e.g. distinguishing 404 "not found/no access" from a 409 conflict body) rather than string-matching `err.message`.

**Auth**: Login/register pages (`app/login`, `app/register`) call `/auth/login` and `/auth/register` and store the returned JWT in `localStorage` under the key `token`. There's no auth context/provider or route guard yet — none of the app's pages check for a token before rendering.

**Routing**: `app/page.tsx` immediately redirects to `/login`. Main routes: `/login`, `/register`, `/companies` (list), `/companies/[companyId]` (detail: edit, members, projects), `/projects` (all projects the user belongs to, across companies), `/projects/[projectId]/board` (the kanban board), `/projects/[projectId]/members`. There is no `/dashboard` route — a single-project dashboard used to live at `app/dashboard/page.tsx` but was replaced by the per-project board under `/projects/[projectId]/board` when the app moved from "one implicit project" to multi-project (and then multi-company) support.

**Companies**: A company groups projects and has its own membership separate from project membership (`role: "OWNER" | "MEMBER"` per company, see `types/company.ts`). `POST /api/projects` requires a `company_id`, so project creation is only ever done in one place — embedded in the company detail page (`app/companies/[companyId]/page.tsx`), which posts to `POST /companies/:id/projects` via `CreateProjectModal` (its `companyId` prop is required, not optional — don't reintroduce a standalone "new project" form that posts to `/projects` directly). Being a company member does **not** imply access to every project in that company — `GET /companies/:id/projects` only returns projects the user is also a `project_member` of, so an empty list there is expected/normal, not a bug; the company detail page's copy reflects that explicitly rather than implying the company has no projects. Company-scoped endpoints 404 (not 403) when the user isn't a member, by backend design — treat that as "not found / no access", not a distinct error state.

**Kanban board** (`app/projects/[projectId]/board/page.tsx`): fetches the project via `GET /projects/:projectId` and its tasks via `GET /projects/:projectId/tasks`, and derives the three columns (`TODO`, `IN_PROGRESS`, `DONE`) by filtering the flat `Task[]` on `Task.status` (see `types/task.ts`) rather than storing per-column state. Drag-and-drop is wired with `@dnd-kit/core` + `@dnd-kit/sortable`:
- `Column` (`components/kanban/Column.tsx`) is a droppable zone whose `id` is the column's status string (`TODO` / `IN_PROGRESS` / `DONE`), takes the current `projectId` as a prop (needed to scope task creation), and wraps its tasks in a `SortableContext`.
- `TaskCard` (`components/kanban/TaskCard.tsx`) is the sortable/draggable item, keyed by `task.id`.
- On `DragEnd`, the target column id becomes the task's new `status`; the UI updates optimistically before `PATCH /projects/:projectId/tasks/:id` fires, and re-fetches from the server on failure to roll back.
- Task creation happens through `CreateTaskModal` (opened from the `TODO` column only, scoped to `projectId`), calling `POST /projects/:projectId/tasks`.
- Task deletion is only exposed for `TODO` tasks (see the status check in `TaskCard`).

**Theming**: `context/ThemeProvider.tsx` implements dark mode by toggling the `dark` class on `<html>` (Tailwind's class-based dark mode) and persisting the choice to `localStorage` under `theme`, falling back to `prefers-color-scheme`. It intentionally renders children without the context during the first mount to avoid hydration mismatches — `useTheme()` returns a safe no-op default `{ isDark: false, toggleDarkMode: () => {} }` when called outside the provider (it does not throw). `Providers` (`app/providers.tsx`) wraps the whole app in `app/layout.tsx`. Both `ThemeProvider` and `ThemeToggle` derive their client-only "mounted" flag with `useSyncExternalStore(subscribeNoop, () => true, () => false)` rather than a `useState(false)` + `useEffect(() => setMounted(true), [])` pair — see the ESLint note below for why.

**Styling**: Tailwind utility classes are used throughout, plus a set of hand-written semantic classes in `app/globals.css` (`.kanban-column`, `.task-card`, `.task-title`, `.task-desc`, `.btn-primary`, etc.) with their own `html.dark ...` overrides. When touching kanban board or card visuals, check `globals.css` in addition to inline Tailwind classes — styling for those elements is split across both.

**Path alias**: `@/*` maps to the repo root (see `tsconfig.json`), e.g. `@/lib/api`, `@/components/kanban/Column`, `@/types/task`.

## Notes for changes

- `types/task.ts` (`TaskStatus = "TODO" | "IN_PROGRESS" | "DONE"`) is the single definition of task status and column identity — column titles, droppable ids, and the status filter logic in the board page all depend on these three literal strings matching exactly.
- `CreateTaskModal` takes `{ projectId, close, refresh }`; `CreateProjectModal` takes `{ companyId, close, onCreated }` (posts to `/companies/:companyId/projects`, not `/projects`) — check the current prop shape in `Column.tsx` / the company detail page before wiring either up elsewhere.
- **ESLint `react-hooks/set-state-in-effect`** (from `eslint-config-next`'s React Compiler-powered `eslint-plugin-react-hooks`) flags `useEffect(() => { ...; setSomeState(x); }, [])`-shaped effects — including indirectly, through a call to a component-scope function whose body ends in a `setState` call — as an error, not just a warning, and CI (`npm run lint`) fails the build on it. It over-fires on legitimate one-time "read an external source and sync it into state" effects (e.g. reading `localStorage`/`matchMedia` on mount), which is exactly what React's own docs describe as a valid effect. Two ways this repo resolves it, in order of preference:
  1. If the state is a simple client/server mount flag, use `useSyncExternalStore(subscribeNoop, () => true, () => false)` instead of `useState` + effect (see `ThemeProvider.tsx` / `ThemeToggle.tsx`) — this sidesteps the rule entirely because there's no effect-time `setState` at all.
  2. Otherwise (e.g. syncing from `localStorage` into real component state, as in `ThemeProvider`'s theme-restore effect, or a plain "fetch a list on mount" effect as in `app/companies/page.tsx`), add a narrowly-scoped `// eslint-disable-next-line react-hooks/set-state-in-effect -- <why>` directly above the flagged call rather than restructuring the whole component around the linter.
- **`react-hooks/immutability`** also flags a component-scope `const fn = () => {...}` referenced by an earlier-declared `useEffect` purely due to source order (even though it works fine at runtime, since the effect only runs after render). Fix by hoisting the function — either move its `const` declaration above the effect, or, if it doesn't close over component state/props, pull it out of the component entirely as a plain top-level function declaration (preferred, since top-level `function` declarations are hoisted and it avoids a pointless per-render redefinition).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
