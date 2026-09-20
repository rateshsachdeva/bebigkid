# Autism Parent Companion — Complete Build Blueprint

Version 1.0 · 15 September 2026 · Product implementation blueprint

Working name: **Alongside**. This is a replaceable development label, not a confirmed brand, domain or trademark clearance. “Vatssala” was a transcription error and is not the app name.

## 1. Read this first: how you will use this plan

You are the product owner, not the programmer. Give this entire file to Codex, Claude Code or another coding agent inside one Git repository. Start with the master instruction in section 19. The agent should implement the numbered phases, verify each phase, record progress and continue. You should not have to translate the technical sections or repeatedly describe the product.

This is a specification and execution plan, not a claim that the application has already been built or tested. It fixes ordinary product and engineering decisions in advance. Real user testing, provider changes and professional review may still lead to improvements; no responsible plan can guarantee zero revisions or permanent freedom from maintenance.

Your responsibilities are limited to providing account access through secure sign-in, controlling expenditure, confirming the final identity and authorising launch after seeing the finished result. The coding agent owns implementation, debugging, migrations, tests and documentation. Do not paste secret keys or real family conversations into the coding agent's chat.

The complete first release is a responsive, installable web application. It works in phone browsers on Android and iOS and on desktop. App Store and Play Store native packages are a separate release described in section 23. They are not quietly included in a web deployment.

## 2. Product definition and decisions

**Purpose:** give adult parents and authorised caregivers a private place to discuss everyday concerns about their autistic child, receive understandable support and build useful continuity across conversations.

**Core experience:** sign in → start talking → optionally add child context → receive a useful, grounded reply → explicitly save useful facts → return later without repeating everything.

**Distinctive value:** relevant child context, parent-controlled memory, reviewed autism knowledge and a calm interface. The model remains a general-purpose model supplied with this context; do not market it as a clinically validated autism specialist or a separately trained clinical model.

| Decision | First-release default |
|---|---|
| Intended users | Adults, 18+, who are parents or authorised caregivers; no child accounts |
| Initial rollout | India-focused invitation-only pilot; avoid claiming worldwide availability/compliance |
| Language | English interface; Hindi and Hinglish conversation support must pass bilingual review before advertised |
| Hosting | Vercel Pro |
| Database/login | Supabase Pro; one production project |
| Starter | Official `vercel/chatbot` repository, adapted after inspecting the actual current commit |
| AI connection | Vercel AI Gateway; keep application integration isolated for a later gateway change |
| AI model | Select from live catalogue after tests; no fixed model name embedded in product logic |
| Model management | Restricted admin screen, database-backed settings, test/activate/rollback |
| Parent experience | One assistant; no model picker or API keys shown to parents |
| Profile | One optional child profile per account in V1; age rather than exact birth date |
| Chat history | Saved until the parent deletes it or deletes their account; policy must disclose this |
| Memory | Explicitly saved and editable facts only; no silent long-term fact extraction |
| Journal | Short optional notes; each entry excluded from AI context unless the parent includes it |
| Knowledge | Reviewed source collection with citations and versioned publication |
| Monetisation | Free access during capped pilot; no billing or subscriptions in V1 |
| Branding | Working name and visual tokens in one configuration location |

**Included in V1:** landing page, email-code sign-in, consent, optional profile, streamed chat, saved conversations, explicit memory, journal, privacy/export/deletion, help, source citations, admin model management, knowledge publishing, budget controls, deployment/runbooks and tested mobile web installability.

**Deferred:** medical-document uploads by parents, voice, native store apps, real-time clinician services, community, co-parent sharing, multiple child profiles, therapist dashboard, automatic research feed, advertising, payments and autonomous actions. Do not show disabled placeholders for these in the released product. Deferral avoids adding privacy and operating obligations before the core service works.

## 3. Success criteria and release boundaries

These are acceptance targets, not claims about current performance:

- At least 8 of 10 pilot participants can sign in, send a first question and find privacy controls without help; exclude external email delays when measuring onboarding time.
- Optional onboarding takes approximately one minute. A parent can skip the child profile entirely.
- No known cross-account data access in the defined automated tests and independent review.
- Parent can locate, correct and delete a saved memory without technical language.
- Every displayed source resolves to a retrieved, published source version; no invented citations.
- No critical harmful output in the agreed evaluation set before enabling a model for real families.
- Normal replies aim for 100–250 words, with room for shorter empathy or longer answers when requested.
- Target first useful content within 8 seconds at the 95th percentile in the pilot; measure actual provider performance and do not fake progress or promise this as a service guarantee.
- A fresh coding agent can resume using repository files, without requiring the owner to retell the project.
- A real production login, chat, retrieval, deletion and model switch pass before public availability.

Release progression: local synthetic demo → private staging → invitation-only real-family pilot after privacy/content gates → broader release after pilot fixes. A deployed preview alone does not mean production-ready.

## 4. User journeys

### A. A worried parent wants help immediately

The landing page has one primary action, “Start a conversation”. Sign-in asks for an email and sends a one-time code. On the first successful sign-in, show a concise explanation of AI processing, saved conversations, voluntary profile information and service limitations. Record consent version and adult/authority declaration. Then offer “Tell us a little about your child” and equally visible “Start chatting instead”.

On entering chat, show “What’s on your mind today?” and optional starters: “A difficult moment”, “School and routines”, “Communication”, “I need some support”. A starter only prefills the composer; it does not send a message automatically.

Do not ask for diagnosis certificates, a child's full name, school name, exact birth date or address. Do not require a profile before providing general support.

### B. A returning parent wants continuity

Landing after sign-in opens Chat with a New Conversation action and recent titles in a drawer. Do not auto-open sensitive old text on a shared screen. A parent can open a prior conversation or start another. New chats receive the current optional profile and explicitly saved memories when “Use my saved context” is on. Turning it off excludes profile, journal and memories for that thread; the current thread's messages still supply conversational context.

Explain the distinction: “Saved context is off for this conversation. Your messages are still saved in conversation history.” This is not a disappearing or anonymous chat feature.

### C. Parent saves an important fact

“What we remember” offers Add memory. Within a chat, “Save a fact” opens an editable text box linked to the chosen message. Do not automatically copy a full response. A parent enters or selects a short fact such as “She prefers a written plan before school”. Save only after an explicit click, showing category and last-updated date. Store provenance so deletion can remove it later.

### D. Parent does not want something retained

Chat menu offers Delete conversation. Show that derived memory and summaries will also be removed. Remove access immediately, then complete verified cleanup. Privacy settings offer a current export, memory reset and account deletion. Do not use guilt-inducing copy or ask a reason for leaving.

### E. Owner wants a new model

Owner signs in to a separate admin area with MFA. Refresh the model catalogue, choose a compatible candidate, inspect supported providers/privacy restrictions, run synthetic evaluations, review results, activate and verify. Activation changes a versioned database setting; no source edit or redeployment for a compatible model. A rollback restores the prior configuration, not deleted family data.

## 5. Information architecture and screens

Desktop: compact left navigation with Chat, Journal, My Child, and Settings. Conversation history lives within Chat. Mobile: four bottom navigation items with the same names; Settings contains What we remember, Privacy, Help and Account. Chat header has a history drawer button. Admin navigation is separate and invisible to ordinary accounts.

| Route | Contents and primary action | Required states |
|---|---|---|
| `/` | Clear purpose, privacy explanation, limitations; Start a conversation | Signed-out, signed-in, maintenance |
| `/sign-in` | Email → code; change email; resend countdown | Sending, wrong/expired code, throttled, delivery failure |
| `/welcome` | Versioned consent; optional profile invitation | New user, declined consent, profile skipped |
| `/chat` | New thread, starters, composer, context toggle | Empty, sending, streaming, stopped, offline, limit reached |
| `/chat/[id]` | Saved messages, source drawer, retry, deletion | Loading, missing, not accessible, interrupted generation |
| `/journal` | Date, note, optional tags, context-inclusion toggle | Empty, list, editing, saving, failed save, delete |
| `/child` | Optional profile fields, save status | No profile, editing, validation error, delete profile |
| `/settings/memory` | View/add/edit/delete explicit memories | Empty, saving, conflict, memory disabled |
| `/settings/privacy` | Context settings, export, delete account; processing explanation | Preparing export, failed job, deletion pending |
| `/settings/account` | Email, sessions, logout, parent MFA option | Reauthentication, expired session, logout failure |
| `/help` | AI limitations, support contact, urgent-help information | Service down; content available without AI |
| `/privacy` and `/terms` | Reviewed notices with versions and effective dates | Publicly readable; no placeholder operator details at launch |
| `/admin` | Aggregate usage and health only | No data, stale metrics, outage |
| `/admin/models` | Catalogue, draft settings, tests, activation, rollback | Unsupported model, failed evaluation, no approved route |
| `/admin/knowledge` | Source metadata, reviewed text, publish/unpublish | Draft, review required, indexing, error, published |
| `/admin/operations` | Limits, jobs, restricted operational status | Retry, partial failure, budget disabled state |

All data-changing actions need visible success/failure. All forms preserve unsent input in component memory after a recoverable error, not persistent browser storage. Deleting or logging out clears in-memory private state.

Chat titles default to a neutral “Conversation · date”. Offer manual rename; do not generate sensitive titles or include them in browser page titles, email subjects or notifications. Do not enable public sharing routes from the starter.

## 6. UI design specification

Design direction: warm, adult, understated and readable. Avoid puzzle imagery, gamification, streaks, celebratory animations, cartoon mascots and clinical-looking dashboards for parents. Use locally bundled system-compatible fonts; no third-party font request needed on a private page.

| Token | Starting value |
|---|---|
| Main background | `#F7F8F5` |
| Surface | `#FFFFFF` |
| Primary text | `#182C29` |
| Secondary text | `#4F625E` |
| Primary action | `#236B5B` with white text |
| Soft highlight | `#E8F1EB` |
| Borders | `#D5DEDA` |
| Error text | `#A12A2A` |
| Body font | System sans-serif, 16px minimum, approximately 1.6 line height |
| Spacing | 4, 8, 12, 16, 24, 32, 48px scale |
| Corners | 12px for fields; 16px for panels |
| Touch controls | Aim for at least 44×44px |
| Chat reading column | About 720–760px maximum width |

Treat these as implementation tokens, and verify actual rendered contrast to WCAG 2.2 AA. Error/status must never depend on colour alone. Include keyboard focus indicators, field labels, screen-reader names, reduced-motion behaviour, 200% zoom and reflow checks. W3C's [WCAG quick reference](https://www.w3.org/WAI/WCAG22/quickref/) is the testing reference.

Mobile requirements: sticky composer above the keyboard, safe-area padding, no horizontal scrolling at 360px, no composer hidden by bottom navigation, source citations open in an accessible sheet, and destructive actions require an explicit confirmation. Do not steal keyboard focus while a reply streams. Announce completion/status to screen readers rather than every token.

Default light appearance; add dark mode only after light-mode acceptance passes. Do not make dark mode a launch dependency.

Suggested copy:

- Welcome: “A little context can help. Share only what you’re comfortable sharing.”
- Context toggle: “Use my saved context”.
- Memory screen: “You decide what the assistant remembers.”
- Composer placeholder: “Tell me what’s happening…”
- Generation failure: “The reply couldn’t finish. Your message is saved. Try again.”
- Offline: “You’re offline. Reconnect to send your message.”
- Limit reached: “You’ve reached today’s conversation limit. You can still read your saved conversations.” Show the actual reset time.
- Model disclosure in settings: identify the service and current processors in plain language, without making model selection a parent task.

All statements about saving, privacy and availability must correspond to implemented behaviour. Do not display “encrypted end-to-end”, “only you can ever read this”, “therapist”, “clinically approved” or “24/7 monitored”.

## 7. Assistant behaviour and autism knowledge

The assistant supports parents, respects autistic people and avoids blame. It should recognise communication and sensory differences, preferences, strengths and caregiver needs. It should not default to compliance, suppression of harmless behaviour or making a child appear non-autistic.

Response pattern is flexible: acknowledge briefly when useful; answer the immediate question; give up to three manageable steps; ask one relevant follow-up only when needed. Do not force empathy scripts, disclaimers, citations or questions into every response. Distinguish observation, possibility and established fact.

Provide support for everyday routines, transitions, communication, sensory environments, school conversations and parent wellbeing. For medical, safeguarding, self-harm or immediate danger questions, use the reviewed response policy. Do not diagnose, prescribe medication/doses, claim a cure, or infer that new pain, illness or injury is merely autism. Do not suggest punishment, dangerous restraint, withholding food or essential communication aids. The service must explain that nobody is monitoring conversations live.

Build a reviewed urgent-help page that works when AI is unavailable. Country-specific numbers and clinical content must be verified at publication; do not infer a user's location from an IP address or hard-code unverified telephone numbers. Until verified, say “Contact your local emergency services” where appropriate. This blueprint does not supply treatment instructions.

### Knowledge preparation

Launch target: 20–30 concise, reviewed knowledge entries covering the product's everyday-support scope. This is a starting editorial target, not proof of coverage. Use trustworthy guidelines, reputable autism organisations, peer-reviewed evidence and autistic lived-experience perspectives, labelled by evidence type. An NHS/NICE/organisation name alone is not permission to copy its materials.

Every entry records title, author/publisher, canonical URL, publication/review dates, evidence type, population/age applicability, geography, topic tags, licence/permission, reviewer identity, review outcome and next-review date. Unreviewed content stays draft. Have an appropriately qualified autism professional and an autistic adult or parent reviewer assess suitability; a coding agent cannot self-certify clinical review.

For V1, admin pastes reviewed plain text/Markdown plus metadata. Avoid a general URL crawler and arbitrary PDF ingestion. Limit each source version to 100 KB of text. Sanitize content, split into heading-aware chunks (initial target 400–700 tokens), and index them in Supabase. Use one verified embedding model and dimension for the index, independently from the chat model. Re-index under a new version if that embedding model changes.

Search only published content. Combine keyword and vector matching; initial retrieve limit six chunks within a fixed context allowance. Tune using evaluation, not arbitrary similarity scores assumed to mean confidence. Apply language and age applicability. If evidence is absent, state the limit and offer appropriately general support; never manufacture a source.

Citations use source IDs issued by the server. Accept only IDs present in the retrieved set. Show clickable source title/publisher and a short supporting excerpt. A valid ID does not prove a claim is supported; evaluate claim-to-source grounding separately. Do not imply that every sentence is medically validated.

Treat retrieved text, journal entries and user messages as untrusted content, never as system instructions. No source can authorise tool execution, disclose a different family or change model settings. The assistant has no general database tool, web browser or outbound messaging tool in V1.

## 8. Architecture and repository rules

Use one Next.js TypeScript application, one Supabase project for production and one AI gateway. Use Node.js server routes for chat. Keep the starter's compatible locked dependency set unless an identified security/compatibility reason requires changes; do not blindly upgrade every package.

The official [Vercel Chatbot starter](https://github.com/vercel/chatbot) documents Next.js/AI SDK/shadcn and defaults to Neon, Auth.js and Vercel Blob. Replace all three backend integrations with Supabase deliberately. Record the upstream commit and retain its licence notices. This recommendation is architectural, not a completed repository security audit.

Required modules:

- `lib/auth`: server session verification and parent/admin role checks.
- `lib/db`: scoped persistence, query functions and transactional operations.
- `lib/ai`: gateway adapter, context builder, model capability validation and response handling.
- `lib/knowledge`: chunking, retrieval, citation validation and source publication.
- `lib/privacy`: consent, lineage deletion, export and redaction.
- `lib/usage`: atomic request reservations, rate limits and cost settlement.
- `lib/jobs`: durable job claims, retries, checkpoints and cleanup.
- `components`: shared accessible UI and feature components.
- `supabase/migrations`: replayable schema changes, indexes and policies.
- `tests`: access-control, integration, browser and AI evaluation fixtures.
- `docs`: decisions, progress, runbook, configuration and review evidence.

Keep a small adapter interface for generate/stream, list models and capability checking. Implement only Vercel AI Gateway initially. Do not build a universal gateway framework or install OpenRouter in advance. A future gateway replacement is developer work once; supported model changes within the current adapter are settings changes.

Runtime settings live in versioned database rows. Secrets live in the deployment's secret/environment settings, never editable plaintext model records, source code or browser bundles. API keys are never needed from a parent.

### Request flow

1. Validate the authenticated session, account status, consent and request schema.
2. Derive owner identity on the server; never accept `owner_id`, role, system prompt or provider credentials from the browser.
3. Verify thread ownership and open state. Acquire a request ID and atomic usage reservation.
4. Load saved context according to the thread toggle and current deletion/consent versions.
5. Retrieve only published knowledge. Build a bounded prompt with source provenance.
6. Read the currently active compatible model configuration and approved routing policy.
7. Apply the reviewed safety handling; generate with timeouts and bounded output.
8. Validate citation IDs and sanitize rendering. Persist response status and usage without content logs.
9. Before final save, recheck that the thread/account was not deleted while generation ran. Cancel/discard if deleted; never resurrect it.
10. Settle cost reservation and record metadata. Failures get safe error messages and trace IDs.

Screening can affect streaming. Use a short preflight to select ordinary support versus reviewed high-risk handling; high-risk answers must be buffered and checked before display. Do not treat a regex or model classifier as a clinical safety guarantee. Do not show hidden reasoning or chain-of-thought from a provider.

## 9. Database contract

UUID primary keys, UTC timestamps, explicit foreign keys, status checks and indexes on owner/time/thread IDs. Store readable chat text as sensitive application data with verified managed encryption at rest and TLS in transit; this design is not operator-blind encryption. Keep content out of audit/usage tables. A future field-encryption design must address keys, backup recovery and search, not just add a checkbox.

| Table | Key fields / purpose | Access |
|---|---|---|
| `parent_profiles` | `user_id`, display_name optional, locale, country optional, status, context_version | Own row; sensitive role/status fields server-managed |
| `consent_events` | user, policy_version, purpose, granted/withdrawn, timestamp | Parent can view own; append through server |
| `child_profiles` | owner, nickname, age_years, communication, sensory preferences, interests, current concerns, updated_at | Own; max one in V1 |
| `threads` | owner, title, use_saved_context, status, context_version, created/updated | Own |
| `messages` | owner, thread, role, content, request_id, generation_status, model_config_version, citations | Own read; roles/provenance controlled by server |
| `memory_items` | owner, text, category, source_thread/message optional, source_kind, version | Own; explicit parent save |
| `journal_entries` | owner, note_date, text, tags, include_in_ai=false | Own |
| `thread_summaries` | owner, thread, text, last_message_id, version | Server-produced, parent can delete via thread |
| `knowledge_sources` | public metadata, review/licence fields, state | Published metadata readable; admin writes |
| `knowledge_versions` | source, text, reviewer, version, state | Admin; published text via controlled retrieval |
| `knowledge_chunks` | version, text, embedding, index_version, tags | Server retrieval; not family data |
| `model_catalogue` | model ID, capabilities, pricing metadata, fetched_at | Admin; no secrets |
| `ai_config_versions` | models, provider restrictions, budgets, prompts, test evidence, activated_by/at | Admin/server only |
| `active_config` | singleton pointer to approved config version | Server read/admin activation |
| `evaluation_runs` | synthetic fixture version, config, results, reviewer, status | Admin only |
| `usage_events` | opaque owner ID, request ID, model, tokens, estimated/actual cost, status | Parent only own aggregate; admin aggregate by default |
| `budget_counters` | scope/date, reserved and settled spend/counts | Server only; atomic updates |
| `jobs` | type, target IDs, state, lease, attempts, next_run, checkpoint | Server only; sanitised admin status |
| `audit_events` | actor ID, action, target opaque ID, timestamp, safe metadata | Restricted; no chat/profile bodies |
| `admin_memberships` | user, role, status; server-managed bootstrap | Restricted; cannot be self-assigned |
| `context_dependencies` | generated message/summary ID, source record ID/type/version | Server-maintained; own-parent scope; supports invalidation |
| `export_requests` | owner, job, private object path, expiry, status | Owner status/download through authenticated endpoint |
| `feedback_events` | owner, optional message ID, rating, issue category | Own creation; admin aggregate; no transcript copy |
| `pilot_invites` | hashed email lookup, expiry, redeemed state | Server/admin only; membership enforced on server |
| `deletion_ledger` | minimal opaque account ID, deletion timestamp/status | Separately protected operational retention; restore replay |

Admin roles are owner and content_editor. Owner manages models, operations and editor membership. Content_editor manages knowledge drafts and review records only. Neither role receives a general parent-content reader. Bootstrap the first owner with a controlled server-side procedure, never by matching a browser-supplied email or editable metadata. Record actual reviewers rather than allowing an automated job to impersonate them.

For duplicated owner IDs in child tables, enforce owner/thread consistency with composite foreign keys or equivalent transactional constraints. Do not assume a valid message ID proves ownership. Store controlled enums and maximum lengths, not unlimited JSON supplied by a browser.

Row-level security must cover every exposed family table. Supabase documents that privileged service roles can bypass RLS; therefore use a session-scoped client for parent operations and separately reviewed privileged paths for jobs/admin. See [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

Policies must cover read, create, update and delete as appropriate. Parent cannot change ownership, role, active config or assistant-authored message fields. Views and database functions must not accidentally bypass policies. Default functions to invoker permissions; narrowly restrict any necessary privileged helper. Check grants as well as policies.

## 10. Endpoint contract

Use server actions or route handlers consistently for simple forms; these logical operations are required regardless of routing syntax. Return typed errors with a correlation ID, never a stack trace or secret.

| Operation | Rules |
|---|---|
| `POST /api/chat` | Authenticated; valid consent; owner-verified thread; request idempotency; one active generation per parent; rate/cost reservation |
| `POST /api/threads` | Server assigns owner; supports context toggle; neutral title |
| `GET /api/threads` | Owner only; paginated; no public IDs endpoint |
| `GET/PATCH/DELETE /api/threads/[id]` | Ownership on every action; delete invalidates derivatives and future writes |
| Profile/memory/journal CRUD | Strict fields/lengths, owner checks, provenance, parent confirmation for memories |
| `POST /api/privacy/export` | Recent reauthentication; own data only; rate limit; durable job |
| `GET /api/privacy/jobs/[id]` | Owner only; sanitised state |
| `POST /api/privacy/delete-account` | Recent reauthentication; immediate access restriction and durable cleanup |
| `POST /api/admin/models/refresh` | Admin + MFA; update catalogue, never auto-activate |
| `POST /api/admin/models/evaluate` | Admin + MFA; synthetic cases only; bounded test budget |
| `POST /api/admin/models/activate` | Admin + MFA; required checks; optimistic concurrency; audit |
| `POST /api/admin/models/rollback` | Admin + MFA; validate old route still available |
| Knowledge create/review/publish/unpublish | Admin/editor authorisation; publication blocked until required review and index ready |
| `POST /api/jobs/run` | Server scheduler secret only; bounded leased batches; never public admin key |

Prevent cross-site mutations with the framework's documented protection plus origin validation where applicable; do not assume cookies alone suffice. Avoid wildcard CORS on authenticated endpoints. Validate auth redirect destinations against an allowlist.

## 11. Memory, journal and context rules

Context priority: safety/system rules → parent's current explicit correction → current profile → current approved memory → relevant opted-in journal → conversation summary → recent messages → published reference content. This is context precedence, not permission for private material to override system rules.

Default prompt budget: at most 12,000 input tokens and 1,200 output tokens, adjustable by approved admin configuration and model context limits. Allocate approximately 2,000 system/policy, 2,000 saved context, 3,000 sources and 5,000 recent thread/summary. Treat these as initial budgets; enforce token-aware truncation. Never trim away core safety instructions to fit additional history.

Read at most five recent opted-in journal entries initially. Explicitly label them parent observations, with dates. Never infer a diagnosis, school, location or relationship from a name. A parent saying something happened once does not create a permanent trait.

Thread summaries are operational context for that thread, not hidden cross-chat memories. Update only when context needs compression; keep version and covered-message boundary, and never use a summary from another thread. Cross-chat knowledge comes only from profile, explicit memories and opted-in journal.

When the parent corrects/deletes a memory or journal entry, increment a context version; do not reuse cached context. Deleting a journal entry also invalidates thread summaries known to have used it. Track context dependency IDs for generated messages/summaries; keep these IDs as metadata, not private content copies. Existing replies may quote prior material: explain that clearing a profile/memory does not erase all previously saved messages; offer “Delete all conversations” separately.

Deleting a conversation removes all memory derived from that conversation even if subsequently edited. Standalone memories created independently remain. Show this in confirmation. Deleting a profile stops future profile use; it does not silently delete the entire account.

## 12. Privacy, retention and deletion

Privacy promise: “Your conversations are private from other users. Our service and selected AI providers process relevant information to generate replies. You control your saved information.” Final public wording must match actual processors, contracts and retention.

Choose the production database region deliberately, preferably near initial users after verifying available regions. This does not establish that every AI request stays in India. Record actual database, hosting, email and AI processing locations/terms. Before real-family pilot, have applicable consent, child-data, cross-border processing and operator obligations reviewed for the initial geography. Do not claim legal compliance from this architecture alone.

Owner/admin has no ordinary interface to browse parent conversations. Infrastructure operators may still have privileged access; minimise personnel, require MFA, record access and keep an incident process. Content reviewers see only synthetic tests and public knowledge. Feedback in V1 sends a rating/category, not a transcript.

| Data | Proposed V1 policy |
|---|---|
| Saved chats/profile/memory/journal | Until parent deletion/account deletion; show this plainly |
| Request bodies and response text in logs | Disabled in app, gateway and third-party observability |
| Operational metadata | 30 days default; investigate provider-specific retention separately |
| Consent/security records | Minimum necessary, separately reviewed retention schedule before launch |
| Export file | Private, automatically removed within 24 hours; authenticated access or short-lived link |
| Deletion jobs | Immediate access removal; target active-system cleanup within 24 hours, monitored for failures |
| Backups | Follow verified service retention; disclose delayed expiry and reapply deletion after restore |
| AI provider copies | Follow explicitly verified provider/endpoint settings; do not equate no training with no retention |

Do not cache private pages, API responses or chat text in a service worker, CDN or shared response cache. Use private/no-store headers, check framework caching and remove private data on logout. No session replay, advertising trackers or email transcript delivery.

Account deletion procedure: validate fresh identity; mark account deleting; deny all new and existing-session reads/writes using account status checks; cancel generation; enqueue cleanup; remove profile/messages/memory/journal/summaries/exports and associated sensitive objects; revoke sessions and delete auth user; minimise required audit record; complete job with no content. Jobs must be idempotent, retryable and independent of a browser remaining open.

Because an issued token may remain valid until expiry, do not rely solely on deleting the auth user or hiding the UI. Apply deleting/status checks in the data access layer and RLS paths. A restore runbook must replay a separately protected deletion ledger before serving restored data. Do not put full personal information in that ledger.

## 13. Model settings without editing code

The gateway provides a unified model interface, but new capabilities or breaking SDK changes can still require maintenance. Routine compatible model selection is a runtime setting. The [gateway model documentation](https://vercel.com/docs/ai-gateway/models-and-providers) supports this architecture; it does not supply the app's admin workflow automatically.

Admin configuration includes primary model ID, optional fallback ID, permitted hosting providers, capabilities, maximum context/output, timeouts, prices, retention/training restrictions, system-policy version and knowledge-index version. Secrets are referenced from secure environment configuration only.

Model catalogue refresh imports live IDs and available metadata, marks disappeared models and reports last refresh. Unknown privacy/capability/pricing fields are “unverified”, not approved. New catalogue entries default disabled. Catalogue discovery must not send family content.

Activation flow: draft → technical validation → synthetic evaluation → human review for behaviour/privacy → atomic activation. Keep test results tied to the exact model/config/prompt/knowledge version. Changes to those invalidate the previous approval as appropriate. Admin can see an estimated per-conversation cost and sample outputs side by side. Always retain one validated rollback config.

Require approved routes for both primary and fallback. If privacy restrictions cannot be satisfied, fail closed with a polite availability message. Do not route automatically to an unreviewed provider to save a request. Provider deprecation alerts create an admin task; do not autonomously publish a replacement model.

Fallback is allowed before user-visible output on transient availability failures. Do not append a second model's answer to a partially streamed response. Mark interrupted replies and allow a fresh, explicit retry. Record which model actually answered each message.

The embedding index has a separate controlled migration: create new index version → regenerate embeddings from source text → evaluate retrieval → activate pointer → keep old version briefly for rollback. Never mix dimensions or silently embed parent chats into shared knowledge.

## 14. Reliability, cost controls and background work

Start with no extra queue vendor. Use a durable Supabase jobs table and authenticated bounded scheduler invocations for deletion, exports and small knowledge indexing jobs. A job has a lease, timeout, retry counter/backoff, checkpoint and terminal error state. Use database locking so two workers cannot execute the same mutation concurrently. Do not start unawaited work after returning a server response or depend on in-memory timers surviving Vercel invocations.

Proposed configurable pilot limits: 30 successful parent turns/day, five send attempts/minute, one active generation/account, 8,000 characters/user message, 1,200 output tokens and a global AI budget initially set to a small owner-confirmed amount. These are product defaults, not permission to buy credits or impose a paid plan. Show reset time; saved data remains accessible when AI spending pauses. Count safety checks, summaries, embedding/indexing, evaluations and retries in usage.

Reserve estimated maximum spend atomically before calls and settle with actual usage afterwards. Track unknown costs conservatively. Expire stale reservations. Use provider-level limits where available in addition to app controls; dashboard alerts alone are not hard caps. Bound fallback attempts and rate-limit login/export/admin evaluation separately.

Set a 45-second initial generation timeout, subject to verified deployment/model limits. After a failed connection, reconcile persisted request status before retrying. Use a unique owner/request key; double clicks and browser retries must not duplicate saved messages. Exactly-once provider billing cannot be guaranteed after ambiguous network failures; record and surface this internally rather than blindly retrying indefinitely.

A successful parent message is persisted before requesting the answer. Assistant state is queued/generating/completed/interrupted/failed. A crashed stream is recoverable as an interrupted reply, not a permanently spinning chat. An expired generation lease releases account concurrency and records a safe status.

Operational dashboard: aggregate active users, completed/failed requests, p50/p95 latency, total cost, deletion-job age, email health, catalogue age, published source count and review dates. No readable chats, prompts, medical categories tied to named users or session replays.

## 15. Accounts, environments and cost planning

the owner supplies the GitHub account/repository, Vercel Pro account, Supabase Pro account, domain when ready, an email-sending account and payment methods for authorised services. The agent should prepare configuration first and request access only when needed. Never ask the owner to paste secret values into a public file or chat.

Production login uses Supabase email one-time codes and a configured transactional email service. The [Supabase SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp) states that its default sender is not intended for production. Configure a verified sending domain, appropriate DNS and rate limits. Do not disable verification to bypass failed delivery. Final SMTP vendor is an operational choice; any supported managed service with suitable terms is acceptable.

Development: local Supabase plus synthetic fixtures where practical. Staging: separate project containing synthetic test data only; a free project can be used with its availability limitations, or budget for additional paid compute. Production: paid project, protected credentials, backups, domain, live email. Never attach an arbitrary pull-request preview to the production database. Never copy real families into staging.

Earlier verified starting prices: Vercel Pro $20/month and Supabase Pro from $25/month, giving a $45 baseline for one production setup within allowances. Verify at purchase. Extra environments, email, domain, AI, taxes and overages are additional. [Vercel pricing](https://vercel.com/pricing), [Supabase pricing](https://supabase.com/pricing).

AI estimate formula: number of turns × ((mean input tokens × input rate + mean output tokens × output rate) / 1,000,000), where each rate is the quoted dollars per million tokens; add screening, summaries, indexing, retries and evaluations. Hypothetical only: 100 parents × 5 turns/day × 30 days = 15,000 turns. At an assumed all-in average $0.005/turn that is $75/month; at $0.02/turn it is $300/month. These are sensitivity examples, not actual model prices or a budget promise.

Budget for professional content/privacy review and occasional engineering maintenance separately. Do not select a weak model solely to make the example budget fit.

## 16. Build sequence and acceptance gates

The sequence is mandatory; phases are implementation checkpoints, not repeated permission questions. Continue through reversible authorised work when access is available. If blocked on a credential or professional review, finish all independent work and record a precise blocker.

| Phase | Deliverable | Gate before marking complete |
|---|---|---|
| 01 Foundation | Repository, licence, dependency baseline, progress files, clean build | Starter inspected; no production services or secrets in repo |
| 02 Design | All parent screens and states with synthetic fixtures | Mobile/desktop flows and keyboard use verified; clearly marked demo |
| 03 Accounts/data | Supabase migrations, authentication, consent, ownership policies | Real test-user email login; A/B cross-account tests pass |
| 04 Chat | Durable streamed chat, history, failure handling, gateway connection | Live staging response; duplicate/retry/deletion-race tests |
| 05 Context | Optional profile, explicit memories, journal and summaries | Context toggle and correction/deletion lineage verified |
| 06 Knowledge/safety | Editorial workflow, index, retrieval/citations, response policy | Synthetic grounding/safety tests; review gate recorded |
| 07 Admin models | Catalogue, evaluations, config activation/rollback | Switch between two supported provider families without code or deploy |
| 08 Privacy/operations | Export, deletion workers, budgets, logs and admin operations | Revoked/deleting sessions denied; job retry and cap tests |
| 09 Mobile/accessibility | Responsive polish, installable web shell, accessible states | Real Android/iOS browser checks; private cache/logout checks |
| 10 Release | Deployment, test report, owner runbook, pilot controls | End-to-end production smoke with synthetic account; human gates and launch decision |

Do not compress this into an unsupported two-hour or one-shot production promise. Progress is measured by gates, not by the amount of generated code. Documentation and tests evolve with each phase.

## 17. Required testing and evaluation

### Engineering tests

- Two parents A/B, a signed-out client and an admin fixture. Attempt every CRUD operation, direct API access and storage/export access across ownership boundaries. Test forged thread IDs, owner changes and roles. Anonymous/admin privileges must not leak into parent data.
- Test consent withdrawal, deleting-account access with a still-issued token, role revocation and admin MFA enforcement.
- Delete during streaming, export during account deletion, repeated job execution, job crash/retry, duplicate send and cost reservations under concurrency.
- Stop generation, timeout, provider outage, unavailable model, invalid config, budget exhaustion and partial response. All must have useful states and no leaked errors.
- Model switch and rollback without deployment; an existing conversation remains readable and can continue with new model context.
- Save/correct/delete memory, delete its source thread, delete opted-in journal, switch saved context off. Assert absent data is not sent in later requests using synthetic fixtures and captured test requests.
- Retrieval unpublished-source exclusion, evidence absent, invalid citation IDs, source prompt injection, embedding version mismatch and failed index publication.
- Content rendering XSS, malicious Markdown links, unsafe HTML, oversized requests and auth redirect injection.
- Private/no-store headers, logout caches, browser back navigation, service-worker cache contents and no transcript in observability.
- Run migrations from empty database and upgrade a previous fixture database. Verify backups by a staging restore exercise, including deletion ledger replay.

### AI evaluation suite

Maintain at least 40 synthetic conversations, versioned in the repository. Cover ordinary support, uncertainty, safety, privacy, language and adversarial cases. At minimum include: difficult school transition; sensory overwhelm; limited communication; parent exhaustion; harmless repetitive behaviour; request for punishment; request for medication dose; new illness; self-harm/immediate danger; possible abuse; unsupported cure; disagreement between sources; unsupported diagnosis; missing child profile; corrected memory; stale journal; request for another family's data; source injection; long chat; Hindi/Hinglish if supported.

Each case defines input, available profile/memory/source IDs, expected behaviour, prohibited behaviour and review rubric. Score relevance, practicality, respect, factual support, uncertainty handling, privacy and urgency. Structural assertions can be automated. A second AI judge may help triage but is not the sole approval authority. High-risk cases require human review by appropriate reviewers.

Model activation threshold: no critical privacy or harmful-response failures, all structural requirements pass and reviewer sign-off for the supported scope. Record limits and failures honestly. Passing 40 cases is not proof of universal clinical safety.

### Owner's simple walkthrough

Using synthetic information: sign in → skip profile → ask a question → add profile → save an explicit fact → start a new thread and verify relevance → disable saved context and verify → open citations → add journal note excluded by default → delete a source conversation and see related memory disappear → export → switch model in admin → delete account → verify sign-in/data access is gone.

The coding agent produces screenshots and a concise pass/fail table. the owner is not asked to inspect SQL or interpret compiler errors.

## 18. Handoff files the coding agent must maintain

| File | Purpose |
|---|---|
| `docs/BUILD_BLUEPRINT.md` | Copy of this source specification; amendments explicitly recorded |
| `AGENTS.md` | Common instructions for coding tools: read blueprint/state, preserve boundaries, test and update state |
| `CLAUDE.md` | Short pointer to AGENTS and state; no conflicting duplicate specification |
| `docs/BUILD_STATE.md` | Last complete phase, current work, exact next step, blockers, tests and commit |
| `docs/DECISIONS.md` | Decisions and reasons; prevent architecture being reopened in every session |
| `docs/CONFIGURATION.md` | Environment variable names, account setup, who controls each setting; never secret values |
| `docs/TEST_REPORT.md` | Commands/results/date/commit, screenshots and untested areas |
| `docs/OWNER_RUNBOOK.md` | Plain-language guide for models, content, costs, outages, export/deletion and updates |
| `docs/LAUNCH_CHECKLIST.md` | Observable release gates and real reviewer/owner sign-offs |
| `docs/DATA_PROCESSING.md` | Actual processors, retention settings, region facts and policy review status |

Use Git checkpoints after coherent verified changes. Follow the host's approval rules for commits/push/deployment; do not assume this planning document authorises account purchases or public launch. Do not overwrite existing work or switch repositories because an agent loses context.

## 19. Master instruction — paste once into the coding agent

```text
You are the lead engineer, product designer and QA owner for my autism-parent
companion application. I am not a programmer. Implement the application rather
than giving me tutorials or asking me to write code.

Read the attached Autism_Parent_App_Build_Blueprint.md in full. Preserve it as
docs/BUILD_BLUEPRINT.md. Treat its explicit defaults, scope, privacy boundaries,
UX flows and acceptance gates as the product specification. This is a new build
unless the workspace already contains the project; inspect before changing it.

Use Vercel Pro, Supabase Pro and the official vercel/chatbot starter. Use Vercel
AI Gateway initially. Model IDs/settings must be runtime database configuration
with an owner-only test/activate/rollback screen. Do not hard-code the model list.

Start with phase 01 and proceed through phases 02–10 in order when unblocked.
Complete and verify each gate before claiming completion. Continue useful
reversible work without asking me to reconfirm decisions already in the plan.
Ask only for genuinely missing access, owner-only business decisions or required
publication/spending approval. Explain the exact blocker and provide the smallest
plain-language action I need to take. Never ask for credentials in this chat.

Create AGENTS.md, CLAUDE.md and the documentation listed in section 18. Update
BUILD_STATE after every phase and before stopping. Record what actually works,
what is mocked, the exact tests performed, next step and blockers. Never report
simulated results or placeholders as implemented functionality.

Inspect current official documentation and the actual starter dependencies before
coding. Keep the lockfile; make changes only for concrete compatibility/security
reasons. Implement session-scoped access plus RLS, source provenance/deletion,
bounded costs, reviewed knowledge workflow and family-data-free operational logs.

Build a calm, accessible phone-first interface using the plan's design tokens.
Use synthetic families only in development, tests, screenshots and AI evaluations.
Do not use my family details as seed data. Do not let any admin browse parent
conversations in the normal product. Do not create public sharing of chats.

Keep the architecture simple: one Next.js app, Supabase and one gateway adapter.
Use durable jobs where required; no fire-and-forget processing. Build only the V1
scope. Do not introduce native apps, payments, community, parent file uploads or
additional gateways without a later explicit scope change.

At each checkpoint tell me: what now works; what you tested; any remaining
limitation; and what happens next. Use plain English. Prepare a concrete reviewable
release before requesting launch. Professional review and production access must
never be fabricated. Begin phase 01 now.
```

## 20. Phase prompts — use only if the agent needs a bounded next task

These prompts refer to the blueprint already in the repository. Do not paste all of them into separate concurrent coding sessions; that creates conflicting edits. One active coding agent should own the repo at a time unless deliberate coordination is set up.

### Phase 01 — foundation

```text
Read docs/BUILD_BLUEPRINT.md, AGENTS.md and existing BUILD_STATE before editing.
Implement phase 01. Inspect the workspace and upstream vercel/chatbot commit,
record its licence and dependency baseline, and establish a clean local build.
Create the required handoff files. Map every existing auth, database, storage,
public-sharing and model-setting path that must change. Remove or disable unsafe
demo/public routes; keep synthetic demo status explicit. Do not provision paid
services yet. Verify the build and document exact next steps for phase 02.
```

### Phase 02 — design

```text
Implement phase 02 using sections 4–6. Build every parent route with reusable
components and synthetic data, including empty/loading/error/offline states.
Use four-item mobile navigation and accessible chat/source/history drawers.
Include optional onboarding, context toggle explanation and explicit-memory UI.
Verify 360px, 390px, 768px and desktop layouts plus keyboard/focus behaviour.
Clearly label mock mode and ensure it cannot silently ship as a working backend.
Show screenshots, update BUILD_STATE and continue when unblocked.
```

### Phase 03 — accounts and data

```text
Implement phase 03 and sections 9–10. Replace Auth.js/Neon with Supabase Auth
and Postgres. Create replayable migrations, constraints and RLS/grants. Implement
email-code sign-in, production SMTP configuration instructions, consent and server-
verified parent/admin identity. Add A/B/signed-out adversarial tests, including
direct API access, forged owner IDs and attempts to self-assign admin. Never
disable verification or expose privileged keys to bypass a setup issue. Verify
actual test-user login when credentials exist; record blockers precisely otherwise.
```

### Phase 04 — chat

```text
Implement phase 04 and the request flow in section 8. Integrate the gateway
through one adapter, read a validated runtime config, persist request/message
states, stream safely and support stop/retry/history. Implement atomic request
deduplication, one active generation, bounded timeouts/cost reservations and
deleted-thread checks. Disable public sharing and sensitive generated titles.
Test a real staging reply, interrupted stream, timeout, duplicate send and a
delete-during-generation race. Do not mark a mocked AI reply as live integration.
```

### Phase 05 — personal context

```text
Implement phase 05 and section 11: optional child profile, explicit parent-saved
memories, journal excluded by default, context switch and bounded thread summaries.
Store provenance/dependency IDs. Corrections invalidate context; deleting a thread
removes its derived memories/summaries and cannot be undone by a running request.
Test with synthetic captured provider inputs that excluded/deleted data is absent.
Do not silently infer enduring facts or embed parent chats into shared knowledge.
```

### Phase 06 — knowledge and behaviour

```text
Implement phase 06 and section 7. Build admin plain-text source ingestion with
metadata/licence/review status, versioned indexing, publish/unpublish, retrieval
and validated source-ID citations. Add the reviewed-policy draft and urgent-help
page with no invented emergency numbers. Create at least 40 synthetic evaluation
cases covering the section 17 categories. Draft content must remain unpublished
until a real reviewer approves it; use labelled synthetic content in staging.
Report source/clinical-review blockers without pretending the agent approved them.
```

### Phase 07 — model administration

```text
Implement phase 07 and section 13. Add admin MFA, live model catalogue, verified
capabilities, draft config, synthetic evaluations, activation and rollback with
an immutable audit trail. Keep provider/privacy restrictions on primary and
fallback routes. Unknown metadata blocks approval rather than defaulting safe.
Demonstrate switching between two supported provider families without code edits
or deployment and continuing a saved synthetic thread. No automatic activation
of newly discovered models and no mixed-provider partial response streams.
```

### Phase 08 — privacy and operations

```text
Implement phase 08 and sections 12–14. Complete export, account/thread deletion,
session/status enforcement, durable leased jobs, retries, operational aggregates,
log redaction and atomic budgets. Test stale tokens after deletion, interrupted
jobs, double execution, export ownership and concurrency at the spending limit.
Document backup expiry and deletion-ledger replay after restore. Remove content
logging/session replay and check third-party telemetry configuration. Confirm
private/no-store behaviour. Do not claim provider retention you have not verified.
```

### Phase 09 — phone usability

```text
Implement phase 09. Add manifest/icons and appropriate install guidance without
caching private pages/messages. Verify Android Chrome and iOS Safari keyboard,
safe-area, navigation, sources, login and logout flows. Add an offline shell that
does not display cached private information. Test accessibility, 200% zoom,
reflow, reduced motion and screen-reader status announcements. Distinguish real-
device results from browser emulation and list any remaining real-device checks.
```

### Phase 10 — release and handover

```text
Implement phase 10. Run the required integration/access/privacy/AI/UX checks,
prepare production configuration and migrations with rollback/restore instructions,
and write the plain-language owner runbook. Verify email and a synthetic end-to-end
journey in the intended deployment when authorised. Produce a reviewable preview,
test report, known limitations and launch checklist. Do not buy services or enable
public real-family access without the applicable owner authorisation and required
review evidence. Finish all independent work before asking for a blocked final step.
```

## 21. Resume and repair prompts

### Continue in a new chat or change coding platform

```text
Continue the existing application in this repository. Read AGENTS.md,
docs/BUILD_BLUEPRINT.md, docs/BUILD_STATE.md, docs/DECISIONS.md and recent Git
changes before editing. Do not restart or redesign it. Verify the last checkpoint,
complete the next unfinished phase and update state. I am not a programmer;
resolve ordinary implementation choices yourself and ask only for an actual
missing dependency or required owner decision. Preserve the V1 scope and privacy
boundaries. Report working, tested and blocked items separately.
```

### Fix a broken feature without rebuilding the app

```text
Investigate the reported failure in the existing application. Reproduce it using
synthetic data, identify the smallest root cause, repair it and verify the full
affected journey. Do not replace the framework, database, auth or UI architecture
to avoid debugging. Add a regression test only where it protects the failing
behaviour, preserve unrelated work and update BUILD_STATE and TEST_REPORT.
```

### Prevent premature completion

```text
Audit the implementation against every V1 requirement and acceptance gate in
docs/BUILD_BLUEPRINT.md. List implemented-and-tested, implemented-but-untested,
mocked, missing and externally-blocked items. Fix remaining authorised implementation
gaps in dependency order. A successful build, attractive screenshot or mocked AI
response is not sufficient evidence that the application works end to end.
```

## 22. Owner runbook and launch checklist

Owner should be able to do these without code: review spending, change compatible models, roll back a model, edit draft knowledge, publish reviewed sources, pause new signups, pause AI while retaining history access, inspect job failures and read outage status. Changes to system behaviour are versioned and evaluated, not a free-form unrestricted “prompt editor” that can disable privacy rules.

Weekly during pilot: inspect aggregate failures/costs, check overdue deletion jobs and review feedback categories. Monthly: synthetic model smoke tests, source review dates, dependency/security maintenance and processor/deprecation notices. After changes: rerun affected gates. A developer handles security updates, breaking SDK changes, schema changes and new modalities; no gateway makes this unnecessary.

Required before real-family access:

- [ ] Final operator identity, support contact, privacy notice and terms are filled in and reviewed.
- [ ] Adult/authority and data-processing consent flows are implemented and recorded.
- [ ] Actual processor/retention/routing settings are documented; claims match configuration.
- [ ] Parent A/B isolation and deletion tests pass against deployed configuration.
- [ ] Backup recovery and deletion replay are demonstrated in staging.
- [ ] No secrets, private logs, public chat links or production data in previews.
- [ ] Content and safety evaluation have real reviewer sign-off; no fabricated clinical approval.
- [ ] Main/fallback models and provider routes passed compatible technical/privacy checks.
- [ ] OTP delivery works with a production email service.
- [ ] Budget caps, graceful outages and urgent-help page work.
- [ ] Android/iOS web behaviour and essential accessibility checks are recorded.
- [ ] Owner has MFA, runbook access, billing visibility and a concrete launch preview.
- [ ] Invitation-only pilot scope and spend are authorised by the owner.

Do not mark unchecked external gates complete. Show “ready for technical review” or “ready for private synthetic demo” when that is the actual status.

## 23. Native Android/iOS release after the web pilot

The web application is the full V1. For native store distribution, retain the same backend, access policies and model configuration. Build an Expo/React Native client as a separate package only after the web pilot validates the core journeys. Reuse API contracts and design tokens; web UI components generally need native equivalents.

Native scope: the same four tabs, email-code auth, streaming chat, sources, profile/memory/journal, privacy, export/delete and account controls. Use secure platform credential storage, deep-link allowlists, cancellation/reconnect handling and no default offline transcript cache. Keep notifications off initially; never show sensitive message content on a lock screen. Add native accessibility and real-device testing.

Native gate: authenticated API compatibility; Android/iOS deep links and expired sessions; App Store/Play privacy disclosures and account deletion; developer account access and current store policy review; real-device screenshots/builds; owner-approved submission. Developer fees, builds and store review are separate costs and external dependencies. Do not promise acceptance or a publication date.

## 24. Reference notes and verification limits

The product design, schemas, prompts, limits and workflow above are proposed implementation decisions. They are not copied vendor guarantees. Platform pricing/features change; the coding agent must verify relevant official documentation before implementing or purchasing.

- [Vercel Chatbot repository](https://github.com/vercel/chatbot): starter architecture and licence to inspect at the selected commit.
- [Vercel AI Gateway models/providers](https://vercel.com/docs/ai-gateway/models-and-providers): unified access and routing options.
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security): database isolation and privileged-role limitations.
- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp): production login-email requirements.
- [Supabase pricing](https://supabase.com/pricing) and [Vercel pricing](https://vercel.com/pricing): starting plan prices and allowances, checked during planning.
- [W3C WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/): accessibility criteria.
- [OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data): example of why no-training and no-retention are different; verify actual selected provider/endpoint terms.
- [OpenRouter AI SDK integration](https://openrouter.ai/docs/guides/community/vercel-ai-sdk): an optional future gateway alternative, not part of V1.

No legal compliance assessment, clinical content certification, repository security audit, production deployment or real-device test was performed as part of preparing this blueprint. Those are concrete release tasks above, not reasons to stop development of the reviewable application.
