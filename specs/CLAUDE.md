# CLAUDE.md — specs/

Loaded automatically whenever Claude reads files in this directory — see the root `CLAUDE.md` for project-wide context. `specs/` is a **staging area for decisions**, not a permanent record; the permanent record is the root `CLAUDE.md` itself (this repo has no nested per-directory `CLAUDE.md` files the way `kanban-backend` does — one flat file covers Architecture, Notes for changes, etc.).

## When to write a spec

Any non-trivial feature: a new page/route, a new component with real behavior (not a one-off styling tweak), a new `lib/*` helper carrying business logic, a new prop/behavior on an existing component, or a change that touches how the frontend consumes or interprets a backend contract (a new field in `types/*.ts`, a new `api()` call, a change to the 401/error-handling flow). Skip it for pure bug fixes, refactors with no behavior change, or a presentational-only tweak (the same bar the Testing policy in root `CLAUDE.md` uses to decide whether a change needs a new test).

## Convention

- One file per feature: `specs/<feature-slug>.md`, named for the feature, not the ticket (`specs/task-watchers.md`, not `specs/KAN-42.md`).
- Copy `specs/TEMPLATE.md` as the starting point and fill in only what's actually known; leave gaps in "Open questions" rather than guessing.

## Lifecycle

1. Write the spec before implementation starts.
2. Bring it to Claude Code — expect a plan drafted from the spec (Plan mode) rather than from a bare prompt.
3. If implementation diverges from the spec (an edge case surfaces, an existing pattern forces a different shape), update the spec too — by the time a PR is up, the spec should describe what actually got built, not what was originally guessed.
4. Once merged, fold anything durable into the root `CLAUDE.md` (Architecture section for structural/data-flow decisions, "Notes for changes" for cross-file sync rules), then delete the spec file. Specs don't accumulate indefinitely.
5. If the feature depends on backend support (a new field, endpoint, or relaxed validation), confirm that support already exists in `../kanban-backend` before writing frontend code against it — there is no shared package between the two repos, so a spec that assumes an unbuilt backend contract will just produce dead frontend code. If the backend needs to change too, that's a separate spec and PR in `kanban-backend` first.

## Relationship to the test mandate

The spec's "Test plan" section should map 1:1 to the mandatory happy-path + negative-case pair required for every new functional change (root `CLAUDE.md` → Testing policy). Writing that mapping down before code exists is the point — it's the cheapest place to catch a missing case, before it's a gap in a `*.test.ts`/`*.test.tsx` file.
