import nodemailer from "nodemailer";

interface VerificationEmail {
  email: string;
  code: string;
}

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function getSmtpPort() {
  return Number(process.env.SMTP_PORT ?? 587);
}

function getSmtpSecure() {
  if (process.env.SMTP_SECURE) return process.env.SMTP_SECURE === "true";
  return getSmtpPort() === 465;
}

export async function sendVerificationEmail({ email, code }: VerificationEmail) {
  try {
    const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
    if (!from) throw new Error("SMTP_FROM or SMTP_USER is not configured");

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = process.env.SMTP_PORT;
    const smtpSecure = process.env.SMTP_SECURE;
    
    console.log("=== SMTP Configuration Debug ===");
    console.log(`SMTP_HOST: ${smtpHost}`);
    console.log(`SMTP_USER: ${smtpUser}`);
    console.log(`SMTP_PASS: ${smtpPass ? '***SET***' : 'NOT SET'}`);
    console.log(`SMTP_PORT: ${smtpPort}`);
    console.log(`SMTP_SECURE: ${smtpSecure}`);
    console.log(`SMTP_FROM: ${from}`);
    console.log(`Target Email: ${email}`);
    console.log(`Verification Code: ${code}`);
    console.log("================================");
    
    if (!smtpHost) throw new Error("SMTP_HOST environment variable is not configured");
    if (!smtpUser) throw new Error("SMTP_USER environment variable is not configured");
    if (!smtpPass) throw new Error("SMTP_PASS environment variable is not configured");

    console.log(`Attempting to send verification email to ${email} via SMTP host: ${smtpHost}`);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: getSmtpPort(),
      secure: getSmtpSecure(),
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: "Your Linz Car Selling verification code",
      text: `Your Linz Car Selling verification code is ${code}. This code is used to complete your account registration.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0a1628">
          <h2 style="margin:0 0 12px">Linz Car Selling verification</h2>
          <p>Your verification code is:</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:18px 0;color:#e8a838">${code}</p>
          <p>If you did not request this code, you can ignore this email.</p>
        </div>
      `,
    });
    
    console.log(`Verification email sent successfully to ${email}`);
  } catch (error) {
    console.error(`Failed to send verification email to ${email}:`, error);
    if (error instanceof Error) {
      throw new Error(`Email sending failed: ${error.message}`);
    }
    throw new Error("Email sending failed due to unknown error");
  }
}
