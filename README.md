# Employer Utilization Report — Technical Exercise

## Background

CleverBenefits is a health benefits platform. Our employer clients need reporting on how their members are using the platform — visit counts, engagement metrics, diagnosis trends, and CSV exports.

A previous engineer used AI to scaffold this reporting feature. It works — the app runs, the dashboard renders data — but the code was never properly reviewed. **Your job is to review and improve the server-side code.**

## Setup

```bash
npm install
npm run dev
```

This starts both the API server (port 3000) and the React frontend (port 5173). Open http://localhost:5173 to see the dashboard.

## Your Task

Review the **server-side code**, identify issues, and fix the most important ones. You can use any tools you'd normally use (AI assistants, documentation, your IDE).

You won't fix everything in 45 minutes — that's expected. The goal is to prioritize well, implement the fixes that matter most, and show your reasoning along the way.

Think out loud — we want to understand how you think, not just what you find.

The engineer running the session is a resource. If you have questions about the product requirements, data model, business context, or anything that feels ambiguous — ask. Strong engineers don't work in a vacuum.

### Files to Review

| File | Description |
|------|-------------|
| `SPEC.md` | Product requirements for this feature |
| `server/utilizationRouter.ts` | tRPC router — API endpoints |
| `server/utilizationService.ts` | Service layer — business logic and data access |
| `server/types.ts` | TypeScript type definitions |
| `server/utils.ts` | Shared utility functions |

### Files You Can Ignore

The following files are infrastructure/boilerplate — they're not part of the review:

- `server/index.ts` — Express server entry point
- `server/db.ts` — In-memory database (mock for this exercise)
- `server/trpc.ts` — tRPC initialization and auth middleware
- `server/zodUtils.ts` — Zod validation utilities
- `server/seed.json` — Sample data
- `src/*` — React frontend (out of scope)
- Config files (`package.json`, `tsconfig.json`, `vite.config.ts`, etc.)

## Stack

- **Server:** TypeScript, Express, tRPC, Zod
- **Client:** React, Vite, Tailwind CSS, Recharts
- **Database:** In-memory JSON (simulating MongoDB-style collections)
