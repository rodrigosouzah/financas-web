# Email and password sign-in

The integration is disabled until a Supabase project and email delivery are configured. Existing ChatGPT and Mac device sign-in remain available. No financial workspace is migrated or renamed by this integration.

## Project setup

1. Sign in at https://supabase.com/dashboard and create a project named Finanças in your organization. Use the Free plan if available and a European region. Enter and store the database password yourself; the app does not need that password.
2. In Authentication, enable Email and Confirm email. Configure a password policy of at least 8 characters. The Supabase Auth service handles password storage, verification and recovery; this app never stores passwords in D1 or profile backups.
3. Set Site URL to `https://financas-rodrigo-web.jammypark15.chatgpt.site`. Allow the exact redirect URLs `/auth/callback` and `/auth/confirm` under that origin. Do not add wildcard external redirects.
4. Configure custom SMTP in Supabase for delivery to testers. The built-in sender is limited to organization-team addresses and is unsuitable for arbitrary public users. Enter SMTP credentials directly in Supabase, not in source files or chat.
5. For confirmation emails, use a link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`. For recovery emails, use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`. These server-verified one-time links also support opening the email in another browser. The PKCE `/auth/callback` route remains available for the default SDK flow.
6. Get the Project URL and **publishable** `sb_publishable_…` key from the project Connect/API settings. Do not supply a secret/service-role key. Set the Sites runtime variables `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `EMAIL_AUTH_ENABLED=true`, then redeploy the same Site. These runtime settings must not be stored in `.openai/hosting.json` or committed.

## Application behavior

- `/auth` provides Entrar, Criar conta and Esqueci minha senha. `/auth/reset` accepts a replacement password after verified email recovery. The SDK manages sessions/PKCE; server `getUser` verifies identity instead of trusting cookie claims.
- New email accounts use a stable `email:<Supabase UUID>` workspace owner key. Changing a display name or email never changes the owner key. Financial data remains in the existing user-scoped D1 workspace table; it is not copied to Supabase.
- Email ownership alone does not grant access to a legacy ChatGPT workspace. Existing users can keep the previous ChatGPT access. An explicit user-controlled backup/restore can migrate records; there is no automatic account merge by email text.
- The Mac authorization page accepts either verified browser email sign-in or the existing ChatGPT sign-in. Native device credentials remain separate and scoped to the same resolved owner.
- Recovery responses do not disclose whether an email is registered. Password values and recovery credentials are not logged, exported or persisted in financial data. Provider rate limits apply.
- The runtime flag keeps current sign-in working while setup is incomplete. No nonfunctional signup/reset buttons are substituted for the existing working login.

## Acceptance checks after setup

The user should create a new account, confirm the email, sign in on two devices, request a password reset, follow the link in another browser, set the new password, verify that the old password fails, and authorize/revoke the Mac. Test only with user-controlled test identities. Confirm email delivery and the redirect allowlist before enabling signup for multiple testers. No real account or email test is performed by the agent without user direction.

Official references: https://supabase.com/docs/guides/auth/passwords , https://supabase.com/docs/guides/auth/server-side/creating-a-client , https://supabase.com/docs/guides/auth/auth-smtp .
