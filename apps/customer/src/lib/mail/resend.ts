import { Resend } from "resend";

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  filename: string;
  bytes: Buffer;
}

export async function sendMailWithAttachment(options: SendMailOptions) {
  const { to, subject, text, html, filename, bytes } = options;

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject,
    text,
    html,
    attachments: [
      {
        filename,
        content: bytes,
      },
    ],
  });
}
