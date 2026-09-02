# <Feature name>

## Summary

One or two sentences: what this adds or changes, and why.

## Pages / components affected

- New or changed page/route (`app/.../page.tsx`), or component (`components/...`). Note if it needs a new entry in `PROJECT_NAV_SECTIONS` (`lib/projectNav.tsx`).
- Which existing components it composes with, and whether any prop shape changes (check current prop shapes in the target files first — see root `CLAUDE.md` → "Notes for changes" for the current list of who-takes-what).

## Data flow

- Which `api()` call(s) this uses or adds: method, path, request body/query params (required vs. optional).
- Response shape consumed, and new/changed status codes to handle (`400`/`403`/`404`/`409`/...) — via `err instanceof ApiError && err.status === ...`, not string-matching `err.message`.
- Any new or changed fields in `types/*.ts`.

## Business rules & edge cases

- Client-side validation, hierarchy/authorization assumptions inherited from the backend (e.g. `TASK_PARENT_TYPE`, `getParentCandidates`).
- Optimistic-update vs. refetch-on-failure behavior, loading/empty/error states, races (e.g. a modal staying mounted while external state changes underneath it).

## Test plan

- Happy path(s):
- Negative / edge case(s):
- (This should map 1:1 to what lands in the component's/helper's `*.test.tsx`/`*.test.ts`, per the root `CLAUDE.md` Testing policy.)

## Out of scope

What this deliberately does not cover, to keep implementation from creeping mid-task.

## Open questions

Anything undecided before implementation starts — resolve these before or during planning, not silently during coding.
