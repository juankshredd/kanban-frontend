# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for a Kanban dashboard: Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, `@dnd-kit`. Standalone repo; sibling `../kanban-backend` (Express + `db.js`, JWT auth) is the REST API.

## Commands

```bash
npm run dev        # dev server (http://localhost:3000)
npm run build      # production build
npm run start      # run the production build
npm run lint       # eslint (flat config)
npm test           # unit tests once (vitest run)
npm run test:watch # unit tests, watch mode
```

## Testing policy

**Every new functional change (new component, new `lib/*` helper, new prop/behavior) ships with unit tests: one happy path + one negative/edge case, no exceptions.** Presentational-only tweaks are exempt, but touching a file with an existing `*.test.ts(x)` sibling means keeping it green and extending it for new branches.

Vitest + `@testing-library/react` (`vitest.config.ts`: jsdom, `@/*` alias; `vitest.setup.ts` loads jest-dom matchers + RTL's `cleanup()` after each test).
- Tests live next to their file (`lib/taskHierarchy.ts` → `lib/taskHierarchy.test.ts`), no `__tests__` tree.
- Pure `lib/*` functions get plain Vitest tests — see `lib/taskHierarchy.test.ts` (happy-path cases, then a "Negative / edge cases" block).
- Components use RTL `render()` — see `TaskCard.test.tsx`/`TaskCardTree.test.tsx`. `@dnd-kit`'s `useSortable`/`useDroppable` render fine without a real `DndContext` wrapper (safe default contexts) — only add one if a test needs real drag behavior.
- `lib/testFixtures.ts`'s `makeTask(overrides)` fills every required `Task` field and auto-increments `id`/`ticket_id` — use it instead of hand-rolling fixtures.

## Architecture

**API access & auth**: every backend call goes through `api()` in `lib/api.ts` (`NEXT_PUBLIC_API_URL`, defaults `localhost:5000`; prefixes `/api`; attaches `Authorization: Bearer <token>` from `localStorage.token`). No other data layer (no React Query/SWR/server actions). Non-2xx throws `ApiError` (`status` + parsed `data`) — branch on `err.status`, don't string-match `err.message`. On `401` specifically, `api()` clears the token and hard-redirects to `/login` (`window.location.href`, skipped if already there) — safe as a blanket rule since the backend only ever returns `401` from `authMiddleware` (bad/expired/missing JWT); login/register failures are `400`. Login/register (`app/login`, `app/register`) POST `/auth/login`/`/auth/register` and store the returned JWT under `localStorage.token`. There's no auth context/provider or route guard beyond the 401 handler — pages don't proactively check for a token before rendering.

**Routing**: `/` redirects to `/login`. Routes: `/login`, `/register`, `/companies`, `/companies/[companyId]`, `/projects`, `/projects/[projectId]` (→ `./board`), `/projects/[projectId]/board`, `/projects/[projectId]/members`. No `/dashboard` (removed when the app went multi-project — don't recreate it).

**Companies**: a company groups projects, own membership (`role: OWNER|MEMBER`, `types/company.ts`), separate from project membership. `POST /api/projects` needs `company_id` — only wired up via `CreateProjectModal` (`companyId` required prop) from the company detail page; don't add a standalone `/projects` create form. Company membership ≠ project access — `GET /companies/:id/projects` only returns projects you're also a `project_member` of, so an empty list is normal. Company-scoped endpoints 404 (not 403) for non-members.

**Project shell**: `app/projects/[projectId]/layout.tsx` (dark, Jira-style sidebar) wraps every sub-route in `ProjectProvider` (`context/ProjectProvider.tsx`), which does the *only* `GET /projects/:id` fetch and exposes `{ project, loading, notFound, error, refreshProject }` via `useProject()`; renders `ProjectSidebar` and short-circuits to a not-found screen on `notFound`. Pages under `[projectId]/` read via `useProject()` (never fetch the project themselves) and call `refreshProject()` after mutations that touch the header/members. Add a sidebar module: new `app/projects/[projectId]/<module>/page.tsx` + one entry in `PROJECT_NAV_SECTIONS` (`lib/projectNav.tsx`) — its only data source. Only Board/Members exist today.

**Kanban board** (`board/page.tsx`): fetches `GET /projects/:id/tasks`, derives `TODO`/`IN_PROGRESS`/`DONE` columns by filtering the flat list on `status`. The full `tasks` array also passes down as `Column`'s `allTasks` prop (distinct from its per-column `tasks` prop) so `CreateTaskModal`/`TaskDetailsModal` can compute parent candidates without a separate fetch. `@dnd-kit/core`+`sortable` power drag-and-drop: `Column`'s droppable `id` is the status string; on `DragEnd` the target column becomes the new `status`, PATCHed optimistically with a re-fetch-to-roll-back on failure. `CreateTaskModal` (TODO column only) POSTs new tasks. Delete is `TODO`-only; deleting a task with children 409s (surfaced via the board's `error` banner).

**Card hierarchy**: fixed chain `EPIC → FEATURE → STORY → TASK/BUG` via `parent_id` (nullable). `TASK_PARENT_TYPE` in `lib/taskType.ts` (`EPIC:null, FEATURE:"EPIC", STORY:"FEATURE", TASK:"STORY", BUG:"STORY"`) mirrors the same map in `kanban-backend/taskController.js` (source of truth, re-validated server-side always) — every child type has exactly one legal parent type, so a cycle is structurally impossible through the API. `getParentCandidates(tasks, childType)` filters an already-fetched list to that one legal type; `getChildTypes(parentType)` is its inverse; `canGainParent(task)` = has a legal parent type AND doesn't already have one. All three live in `lib/taskType.ts` and are reused everywhere a parent/child relationship needs computing — don't re-derive them inline.

**Nested/contained child cards (board rendering)**: within a column, a child renders visually inside its parent's card instead of as a sibling. `buildTaskTree(columnTasks)` (`lib/taskHierarchy.ts`) groups **one column's already-filtered list** into a `{task, children}` tree by `parent_id` alone (not `TASK_PARENT_TYPE`, so it's generic up the whole chain) — a task only nests if its parent is **also in that same column's list** (a dragged-apart parent/child pair falls back to a root node); defensive against self-reference/cycles via a single-pass grouping (see tests for exact guarantees). `TaskCard` stays hierarchy-agnostic: `compact?`/`children?` props only (compact shrinks sizing + swaps to `bg-slate-700`; `children` renders in an indented bordered slot when non-empty — note `Array.isArray(children) ? children.length > 0 : Boolean(children)`, since `Boolean([])` is `true`). `TaskCardTree` is the recursive `compact={depth>0}` composer `Column` maps `buildTaskTree(tasks)` through instead of a flat map; dnd-kit's `SortableContext` items stay the flat per-column id list regardless of DOM nesting.

**`TaskDetailsModal`** (Jira-style two-column layout, `grid-cols-[minmax(0,1fr)_372px] w-[1240px]`, app's existing slate/blue theme, not the design mockup's own tokens): shows only the sections a card type has data for — no Child issues for leaf types, no `+ Add related card` when `canGainParent` is false. Left: title, action row, read-only description (backend's `PATCH` has never accepted title/description), per-type `details` fields, `ChildIssuesList`. Right: status `<select>` (immediate `PATCH {status}`, doesn't close the modal), Details box (Parent `<select>` via `getParentCandidates` + type tag), timestamps, Cancel/Save (still only persists `details`+`parent_id`). Its `parentId` state has an external-resync `useEffect` keyed on `task.parent_id` — needed because `CreateRelatedTaskModal`, opened from here, can update the parent link while this modal stays mounted; removing the effect reintroduces a fixed bug (stale `parentId` silently overwrites a fresh link on Save).

**`CreateRelatedTaskModal`** (parent-only): `POST` a new task typed `TASK_PARENT_TYPE[sourceTask.type]`, then `PATCH` the source task's `parent_id` to it. Only mounted when `canGainParent` is true. `pendingParentId` state survives both a failed link `PATCH` and a `Back`-then-retry, so retrying only redoes the link, never a duplicate `POST` — preserve this, it fixes a real regression. `refresh()` fires exactly once per attempt, in `finally`, regardless of outcome.

**`ChildIssuesList`** (`components/kanban/ChildIssuesList.tsx`): the only child-creation entry point (`TaskDetailsModal`'s `Create subtask` button just focuses its quick-add input via `quickAddRef`). `getDirectChildren(tasks, parentId)` (`lib/taskHierarchy.ts`, unscoped by column unlike `buildTaskTree`) computes its `childTasks` prop — **not** `children` (ESLint's `react/no-children-prop` rejects that name on a non-children-taking component). Per row: status `<select>`, and a remove button that **unlinks** (`PATCH parent_id:null`) rather than deletes (works at any status, unlike the `TODO`-only board delete). Quick-add defaults to `getChildTypes(parentTask.type)[0]`; fix the type afterward via the existing type badge if wrong. Drag-reorder is native HTML5 DnD (separate DOM subtree from the board's own `DndContext`, no conflict) — live-splice on `dragover`, `PATCH after_task_id` only on drop, **explicitly rolled back to the last-known `childTasks` order in the `catch`** (a resync effect alone isn't enough: its dependency key doesn't change when the persist fails and the server order is unchanged). Reordering moves the child's *global* per-project `rank` (same value the board sorts by) — intentional, not a bug.

**Deliberately out of scope** (no backing data): "Related to"/non-hierarchical links (`blocks`/`relates to`/etc. — `parent_id` is the only relationship mechanism that exists; would need a new backend table + endpoints, a separate PR in the other repo); Assignee/Reporter/Points/Labels/Sprint display; "Relationship map"; Development (Git) and Activity (comments) sections. Don't add frontend UI for any of these without the backend support landing first.

**Theming**: `context/ThemeProvider.tsx` toggles the `dark` class on `<html>`, persists to `localStorage.theme` (falls back to `prefers-color-scheme`); renders children without context on first mount to avoid hydration mismatch, so `useTheme()` has a safe no-op default outside the provider. `ThemeProvider`/`ThemeToggle` derive their mount flag via `useSyncExternalStore(subscribeNoop, ()=>true, ()=>false)`, not `useState`+effect — see the ESLint note below.

**Styling**: Tailwind utilities everywhere, plus a few hand-written classes in `app/globals.css` (`.kanban-column`, `.task-card`, `.btn-primary`, etc.) with their own `html.dark` overrides — check both when touching board/card visuals.

**Path alias**: `@/*` → repo root (`tsconfig.json`).

## Notes for changes

- `types/task.ts`'s `TaskStatus`/`TaskType` are the single source of truth (column titles/droppable ids/status filters depend on the exact 3 status strings). Adding a `TaskType` means updating `TASK_TYPES`/`TASK_TYPE_CONFIG`/`TASK_PARENT_TYPE` in `lib/taskType.ts` *and* `TASK_DETAIL_FIELDS` in `lib/taskDetails.ts` *and* the backend's copies in `taskController.js` — no shared package between the repos, kept in sync by hand.
- Prop shapes: `CreateTaskModal{projectId,tasks,close,refresh}`, `TaskDetailsModal{task,projectId,tasks,close,refresh}` (both need the full unfiltered `tasks` for `getParentCandidates`), `CreateRelatedTaskModal{sourceTask,projectId,close,refresh}` (no `tasks` — only ever creates a new parent), `ChildIssuesList{parentTask,childTasks,projectId,refresh,quickAddRef?}`, `CreateProjectModal{companyId,close,onCreated}` (posts to `/companies/:id/projects`, not `/projects`). Check current shapes before reusing any of these elsewhere.
- **ESLint `react-hooks/set-state-in-effect`** flags any `setState` inside a `useEffect` body as an error (even indirectly, via a helper function) — including legitimate one-time "sync an external source into state" effects (reading `localStorage`, resyncing from a changed prop). Fixes, in order of preference: (1) if it's just a mount flag, use `useSyncExternalStore` instead (see `ThemeProvider`) — no effect-time `setState` at all; (2) otherwise, a narrowly-scoped `// eslint-disable-next-line react-hooks/set-state-in-effect -- <why>` right above the call. Note: effects with a real non-empty dependency array (e.g. `[task.parent_id]`) often don't actually trigger this rule — try without the disable comment first, ESLint will tell you if you need it.
- **`react-hooks/immutability`** flags a component-scope `const fn = () => {}` referenced by an earlier `useEffect` due to source order alone. Fix by hoisting — move the `const` above the effect, or (preferred, if it doesn't close over props/state) pull it out as a top-level `function` declaration.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
