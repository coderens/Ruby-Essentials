# Membership decision email notifications

The Supabase Edge Function `notify-application-status` sends a decision email to the address saved on a join application after an administrator approves or rejects it. The function verifies the signed-in administrator and reads the saved status from Supabase; it does not trust a status supplied by the browser.

## One-time email-provider setup

1. Create a Resend account and an API key at [Resend](https://resend.com/).
2. Add and verify a domain in Resend. Use a sender address on that verified domain. A sender domain is required for sending real notifications to applicants.
3. Open the [Ruby Essentials Supabase Edge Function secrets](https://supabase.com/dashboard/project/vkhhikpbhjzrtinfqypk/functions/secrets) page.
4. Add these two secrets:
   - `RESEND_API_KEY`: the API key from Resend.
   - `EMAIL_FROM`: sender identity on the verified domain, for example `Ruby Essentials <notifications@your-verified-domain.com>`.
5. Save the secrets. The function is already deployed; no sender secrets belong in Vercel or in frontend code.

Keep the Resend key private. Do not commit it to GitHub or paste it into chat.

## Behavior

- When an admin clicks **Approve** or **Reject**, the application status is saved, then the function attempts to send the corresponding email to that application's saved email address.
- The admin interface reports whether email sending succeeded. If it fails, the status remains updated and the admin can use **Resend email** after fixing the configuration.
- Confirmed-signup applications store the user's email in `public.join_applications.email`, including applications created by the email-confirmation trigger.
- The function uses the signed-in caller's JWT and admin app-metadata role checks. It does not expose a Supabase service-role key to the browser.
