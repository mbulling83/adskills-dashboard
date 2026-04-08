@AGENTS.md

# Development Rules

## Test-Driven Development — MANDATORY

Every new feature, bug fix, and behaviour change follows TDD. No exceptions.

**Workflow:**
1. Write a failing test in `tests/`
2. Run `npm test` — confirm it fails for the right reason
3. Write the minimal code to make it pass
4. Run `npm test` — confirm all tests pass
5. Refactor if needed, keeping tests green

**Test locations:**
- `tests/lib/` — pure logic (platform detection, permissions, announcements, etc.)
- `tests/components/` — React components via React Testing Library
- `tests/api/` — API route handlers (mock Supabase client)

**Run tests:**
```bash
npm test            # single run
npm run test:watch  # watch mode during development
npm run test:coverage
```

**The pre-commit hook enforces this** — commits are blocked when tests fail.

## Pure Logic Goes in lib/

Business logic must live in `lib/` as pure functions — not inside Edge Functions or components — so it can be unit tested. Extract logic before implementing, write tests first.

Current lib modules:
- `lib/platform-detection.ts` — ad platform detection patterns
- `lib/permission-risk.ts` — permission risk classification
- `lib/announcements.ts` — announcement visibility and filtering
- `lib/supabase/` — Supabase client helpers
