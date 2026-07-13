Local SMTP setup and testing

This project already implements `sendVerificationEmail` in `src/lib/email.ts` using `nodemailer` and exposes `/api/send-verification-email` on the server.

What I added:
- `.env.local` (gitignored) with SMTP values for local development.
- `render.yaml` declared SMTP-related env keys (no secrets committed).
- `package.json` `start` script updated to preload `dotenv` so local `.env*` files are loaded when running the server.

How to test locally

1. Ensure `.env.local` is present in the project root with your SMTP credentials (already created for you). The file should contain:

SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM

2. Start the server (this will load `.env.local`):

```bash
npm run build
npm start
```

3. In the web UI, sign up using a test email. The client will call `/api/send-verification-email` with a 6-digit code, which the server will send using the SMTP settings.

Notes and safety

- Never commit `.env.local` or secrets to source control. `.env*` is added to `.gitignore`.
- For deployment, configure the SMTP environment variables securely in your hosting provider (Render, etc.). `render.yaml` declares the variables so you can sync them via the dashboard or CLI.
- If using Gmail, ensure the account allows SMTP access (App Passwords are required for accounts with 2FA).
