# Fetch 22

Fetch 22 started as a patient no-show tool and is growing into a **CRM for dental specialists**. It covers referring-doctor relationships, the referral pipeline and patient communication, and runs on top of whatever practice-management system (PMS) a practice already uses.

- Research behind it: [docs/research/dental-crm-research-brief.md](docs/research/dental-crm-research-brief.md)
- Customer interview guide: [docs/research/interview-guide.md](docs/research/interview-guide.md)

## What's built (MVP slice for endodontics, oral surgery and periodontics)

| Area | Route | What it does |
|---|---|---|
| Dashboard | `/crm` | Referral volume and trend, open pipeline value, unscheduled referrals, reports owed to referrers, relationships needing attention |
| Referring doctors | `/crm/referrers` | Each referring doctor with a health status (new, growing, steady, declining, lapsed, dormant), a 0–100 score, trend and 12-month value |
| Referring doctor detail | `/crm/referrers/[id]` | Lapse alert, monthly referral chart, referral history, outreach log (visits, lunch & learns, CE, gifts) |
| Referral pipeline | `/crm/referrals` | Board from received → contacted → scheduled → seen → treatment complete, with one-click advance |
| Referral detail | `/crm/referrals/[id]` | Status changes enforced by a state machine, audit timeline, text-consent status, specialty report checklist |
| Referral portal | `/refer/[slug]` | Public form referring offices use to send a patient. Matches or creates the referring doctor and records text consent. |

**Core modules**

- **Specialty packs** (`lib/specialties.ts`): referral reasons, care cadences and report checklists per specialty. Endodontics, oral surgery and periodontics are live; the other specialties are defined for later.
- **Referrer health scoring** (`lib/referrers/health.ts`): flags a referrer whose silence is unusual for *their* normal rhythm, or whose volume is dropping.
- **Messaging compliance gate** (`lib/messaging/compliance.ts`): tracks consent per channel and per purpose, honors revocation, requires written consent for marketing, enforces TCPA healthcare-exemption limits and quiet hours, and detects opt-out replies. It encodes product policy and needs legal review.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000/crm, seeded with a fictional endodontic practice
npm test           # unit + integration tests (Postgres via in-memory PGlite)
npm run typecheck
npm run build
```

With no `DATABASE_URL`, the app runs an embedded Postgres (PGlite) in `.data/` and seeds demo data on first start. Delete `.data/` to reset it.

## Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string for real data. Migrations in `drizzle/` run automatically. |
| `CRM_ORG_SLUG` | Organization the CRM serves (required with `DATABASE_URL` until user accounts exist). |
| `CRM_BASIC_AUTH` | `user:password` for HTTP Basic auth on `/crm`. **The CRM refuses to serve real data without it.** |

Schema changes: edit `lib/db/schema.ts`, then run `npm run db:generate`.

## Before handling real patient data

This MVP is **not production-ready for protected health information (PHI)**. Required first:

- [ ] Real user accounts and per-user, per-location roles (replaces `CRM_BASIC_AUTH`)
- [ ] BAAs with the hosting provider, database provider, and SMS/email vendors; US-only regions (Texas SB 1188)
- [ ] Audit logging of PHI access; encryption at rest; backups with tested restore
- [ ] Rate limiting and bot protection on the public referral portal
- [ ] Legal review of the messaging policy (FCC revocation rules effective 2026-11-25)
- [ ] SOC 2 Type I readiness (needed for the Dentrix API Exchange and DSO sales)

## Deploy (Vercel)

Set the root directory to `/` and leave the output directory unset. Without `DATABASE_URL`, the demo uses `/tmp` and resets on cold starts.
