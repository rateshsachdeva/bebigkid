# Finish the existing bebigkid deployment

Repository: https://github.com/rateshsachdeva/bebigkid
Vercel project: https://vercel.com/giftingarena/bebigkid
Supabase project: https://supabase.com/dashboard/project/flpzyiprlqloebxxiuyu

The Supabase schema is installed. The Vercel connector currently cannot see this project, so project settings and secret values cannot yet be verified or changed from this session.

## Vercel settings

In this project's Settings → Git, connect `rateshsachdeva/bebigkid` and use branch `main` for production. The framework is Next.js, the root directory is the repository root, Node.js is 24.x, install is `pnpm install --frozen-lockfile`, and build is `pnpm build`. No database command belongs in the build command.

Add these under Settings → Environment Variables. Copy secret values directly between provider dashboards; never into GitHub, public files, or a chat message.

| Name | Value or where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://flpzyiprlqloebxxiuyu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase project Settings → API Keys → publishable key |
| `SUPABASE_SECRET_KEY` | Same project's secret API key; server-only. A legacy key under `SUPABASE_SERVICE_ROLE_KEY` is supported as an alternative. Set one of these, not both. |
| `APP_URL` | `https://bebigkid.vercel.app`, if that is the project's assigned production domain |
| `AI_GATEWAY_API_KEY` | A Vercel AI Gateway key for this app, when ready for synthetic model tests |
| `CRON_SECRET` | New random value from a password manager; used only by the scheduled worker |
| `ALLOW_REAL_FAMILY_PILOT` | `false` |
| `NEXT_TELEMETRY_DISABLED` | `1` |

After adding variables, redeploy the latest commit. Values added after a build do not repair the existing deployment. `/preview` works without these services and does not call the AI or database. The live sign-in and account paths require the database keys.

Apply production values only to production initially. For preview deployments, use a separate staging database and matching exact `APP_URL`, or leave private APIs unconfigured and review `/preview`. Do not share production credentials across arbitrary pull-request previews.

The cron in vercel.json runs once a minute and requires the paid Vercel plan selected by the owner. Confirm the actual plan and billing in the project's dashboard. The AI operating settings remain paused with a zero-dollar budget until the owner changes them; there is no chargeable model configured by this setup.

## Sign-in and owner access

Configure the Supabase Auth site URL to the verified app domain and its email template to include the email code (`{{ .Token }}`). Set a production SMTP sender. The app deliberately requires a pilot invite before requesting email delivery; there are no invites or administrator accounts yet.

Google account creation/sign-in is implemented through the server-side PKCE
flow. In Google Cloud create a Web application OAuth client. Add
`https://flpzyiprlqloebxxiuyu.supabase.co/auth/v1/callback` as its authorised
redirect URI and `https://bebigkid.vercel.app` as an authorised JavaScript
origin. In Supabase Authentication → Sign In / Providers → Google, enable the
provider and enter the Google client ID and secret. In Supabase Authentication
→ URL Configuration, set the Site URL to `https://bebigkid.vercel.app` and add
`https://bebigkid.vercel.app/auth/callback` to the redirect allow list. Google
creates new Auth users without the invitation table; email-code access remains
invitation-only until production SMTP and abuse protection are configured.

Once the owner specifies the sign-in email, an authorised setup session can add its hash to pilot_invites. After the owner signs in, assign the verified Auth user ID in admin_memberships. The owner then sets up MFA at `/admin`. Do not create an unauthenticated administrator registration route.

## Release gate

The landing page and fictional walkthrough can be reviewed now when deployed. Keep real-family access closed until hosted isolation, auth, export/deletion, professional content, privacy and live-model evaluations pass. The original prototype's limitations remain documented in BUILD_STATE.md.
