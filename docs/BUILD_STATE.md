# Build state — 20 September 2026

## What this deliverable is

A pre-release web application with an interactive fictional walkthrough and backend implementation. The database schema is now installed in the dedicated bebigkid Supabase project. Vercel integration and authenticated end-to-end verification remain incomplete. It is **not ready to accept real family information**. `ALLOW_REAL_FAMILY_PILOT` must remain false.

Working name: Alongside. No production brand decision is implied. This release targets a responsive web app; native Android and iOS apps remain a later phase.

## Implemented source

- Calm desktop/mobile parent workspace; optional child profile; chat history and deletion; explicit saved facts; journal notes excluded from AI by default; per-conversation context switch; privacy/export/deletion screens.
- Server-side email-code auth, exact-origin mutation checks, verified session ownership, Supabase RLS and composite ownership constraints, owner-only controls with MFA, no admin transcript viewer.
- Vercel AI Gateway adapter, bounded context, active configuration from the database, provider allowlist, versioned model candidates, synthetic evaluation queue and human approval before activation. No model selector exposed to parents.
- Conservative safety classification; sensitive answers buffered and checked before display. These automated checks are fallible and have not been validated against live models.
- Draft/review/publish knowledge workflow and keyword retrieval; source citations constrained to retrieved IDs.
- Transactional AI budget reservations, daily limits, duplicate request rejection, one generation at a time, stale generation cleanup and emergency pause.
- Durable export, deletion, source-indexing and evaluation jobs; authenticated expiring exports; immediate access removal on account deletion; cleanup retries.
- Environment example, migration, deployment checklist, CI checks and continuation instructions.
- Unused generic starter code and more than 600 resolved packages removed. Original MIT licence retained.

## Verification actually performed

- Production Next.js build: passed, without live secrets.
- TypeScript check: passed.
- Ten automated policy/database tests: passed. Database tests execute PostgreSQL in PGlite with synthetic Supabase roles/Auth/Storage fixtures. They cover cross-parent read/write denial, service-only RPCs, duplicate accounting, budget rejection, memory provenance cascade, late reply after conversation deletion and deletion access revocation. The fixture excludes vector retrieval and does not emulate Supabase Auth or Storage services.
- Three browser/API scenarios: desktop chat/journal/memory walkthrough; mobile navigation, overflow and composer placement; unconfigured APIs fail closed and jobs require authentication. See `browser-results.json` and screenshots for the latest run.
- Browser automation used local Playwright with an alternate Chromium executable because the normal browser download timed out and agent-browser could not start in this environment. This is local browser evidence, not hosted-device certification.

## Remaining release work

1. The user supplied dedicated projects; no new project purchase is needed. Finish Vercel access, provider environment variables, SMTP, invite/owner bootstrap and cron verification. No unrelated project has been changed.
2. The full initial migration and platform security migration are installed. Run two-real-session RLS/Auth/Storage tests, session expiry/MFA, blocked-account access, asynchronous export/download/deletion, timeout/retry, job recovery and budget concurrency tests against hosted services. Review Supabase security advisors.
3. Replace placeholder privacy/terms/consent text with reviewed operator-specific text. Add final support details, explicit retention schedules, consent withdrawal/reconsent workflow, incident procedure and backup deletion/restore safeguards. The app cannot honestly promise that its server or AI provider never processes readable family text.
4. Clinical/content review and a real reusable knowledge corpus. The 40 synthetic prompts are present; **no model evaluation run or clinical approval has occurred**. Extend evaluation to the full chat pipeline, context/retrieval and multilingual adversarial prompts. Current jobs exercise the base policy only.
5. Semantic embeddings and retrieval quality testing; enforce source review expiry and source versioning. Current retrieval uses English keyword matching, not semantic search. Configure privacy and costs for any embedding provider before adding it.
6. Long-thread summarisation and context dependency invalidation are not connected. Chat currently uses up to 16 recent messages plus explicitly saved context. Tables exist for future summaries. Removing a memory does not remove quotations in old chat messages; the UI states this.
7. Add pagination/loading UI for histories older than 50 conversations or 100 notes/memories; current exports paginate full records. Harden export snapshots and large exports. Test deletion of an account while a generation is reserving or settling costs; reconcile reservations before cascading usage data.
8. Validate streamed errors, safe retry semantics, aborted requests and buffering with live models. Server duplicate IDs are rejected, but resubmitting text creates a new request. No automatic provider fallback is implemented; unknown failures must not silently switch processors.
9. Secure owner invite management and more usable pricing/provider selection. Model switching is source-free for supported gateway models after testing; gateway API changes or unsupported capabilities can require code maintenance.
10. Dependency/security review and hosted operational monitoring that excludes transcripts. Verify cost estimates against real invoices; application limits are not a guaranteed provider billing cap. Include hosting, email, storage and retrieval costs.
11. User testing with parents and autistic reviewers, keyboard/screen-reader/zoom checks, real iOS/Android browser and keyboard testing. A visually checked prototype is not proof of the best UX. Raster installation icons, accessibility audit and native apps remain later work.

## Integration update

Target repository: rateshsachdeva/bebigkid. Target Vercel project: giftingarena/bebigkid. Target Supabase: flpzyiprlqloebxxiuyu, healthy, Seoul region selected by the owner.

Applied migrations: 20260920054022_alongside_initial and 20260920054238_platform_security. Local filenames match the hosted migration history.

Hosted catalog verification: 24 tables; all 24 have RLS; anonymous and parent roles cannot execute begin_turn; parents cannot read admin_memberships; service_role can execute begin_turn; parent-exports bucket is private; zero family profiles; AI paused.

Security advisor after remediation: zero warnings/errors; 15 informational notices for service-only tables with RLS and no client policies. This is intentional default-deny access; do not add permissive policies to silence these notices.

Google account creation/sign-in is implemented with a server-side PKCE callback,
central parent-profile provisioning and canonical redirects. TypeScript, the ten
policy/database tests, production build and four browser/API scenarios pass.
The hosted Google callback has now been verified with the owner's account.
Creating an Auth account does not by itself grant access to real-family features:
while the global pilot flag remains false, consent and chat require a current
hashed pilot invite for that account's verified email. Email-code access also
remains invitation-only and the default SMTP rate limit was observed in hosted
testing.

Owner MFA enrollment now recovers from an interrupted setup by removing only
the owner's stale, unverified TOTP factors before issuing a fresh QR code.
Verified factors are never removed by this recovery path.
The verification step also recovers a pending factor after a page refresh,
normalises pasted six-digit codes and reports expired sessions, rejected codes
and disabled TOTP verification separately. Supabase TOTP MFA is enabled; AAL1
sessions are limited to 15 minutes, so first-time setup must be completed soon
after a fresh sign-in.

The hosted fixture test was attempted but the SQL connector runs in a read-only transaction, so its INSERT was rejected before fixtures were created. No permissions were widened. supabase/tests/hosted_isolation.sql is ready for execution through an appropriately authorised staging database connection. Hosted Auth/Storage and AI pipeline checks remain pending.

Vercel connector currently returns project-not-found for bebigkid, exposes only the older project, and its advertised deploy tool is unavailable. It cannot set the project's environment variables in this session. Reconnect it with access to the supplied project. See CONFIGURATION.md for exact dashboard values/fields to finish securely.
