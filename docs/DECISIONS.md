# Decisions
- 2026-09-20: Start from official vercel/chatbot c2f8235; retain UI primitives and dependency baseline.
- Replace generic tool/artifact/auth/sharing runtime with purpose-built Supabase parent app. Keep package dependencies until installation verifies.
- No existing account projects are reused: existing business projects are unrelated.
- `/preview` is an explicitly labelled in-memory synthetic walkthrough, isolated from real APIs. It is not a login bypass.
- Default runtime remains closed to families until deployment and content/privacy review gates pass.
- Removed unused starter infrastructure, analytics, generic editors and packages after successful installation; retained five UI primitives and the original licence.
- Hosted verification is a release gate. Local PostgreSQL fixture results are not represented as hosted Supabase security certification.
- No native app or public launch included in this pre-release archive.

- User supplied the bebigkid repository, Vercel project and Supabase project. Schema installed in flpzyiprlqloebxxiuyu; do not create another project. The connected Vercel account cannot currently access bebigkid.
