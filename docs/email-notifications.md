# Free Gmail notification setup

Ruby Essentials now has a Supabase Edge Function configured to call a Google Apps Script sender. To finish setup, authorize a Google account to send mail and add two secrets in Supabase.

1. Open [Google Apps Script](https://script.new/) using the Gmail account that should send notifications.
2. Copy the contents of [scripts/google-apps-script-notifier.gs](../scripts/google-apps-script-notifier.gs) into the new project's `Code.gs` file and save.
3. In Project Settings, add the script property `RUBY_ESSENTIALS_WEBHOOK_SECRET` with a long, random value. Keep this value private.
4. Run `authorizeMailService` once and approve the Google Mail permission.
5. Deploy as a Web app, execute as your account, and set access to anyone. Copy the Web app URL ending in `/exec`.
6. In [Supabase Function Secrets](https://supabase.com/dashboard/project/vkhhikpbhjzrtinfqypk/functions/secrets), add `GOOGLE_APPS_SCRIPT_URL` (the URL from step 5) and `GOOGLE_APPS_SCRIPT_SECRET` (the exact same random value from step 3).
7. Sign into Ruby Essentials as an administrator and test an approval and a rejection using test applications whose recipient inboxes you can check.

The email is sent from the Google account you authorize. No paid domain is required. Google account type and quotas may affect availability. If sending fails after the application status changes, fix the sender configuration and use **Resend email**.

Never put the shared secret in frontend code or commit it to GitHub. Do not share your Google password or the secret in chat.
