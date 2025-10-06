import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  filename: string;
  bytes: Buffer;
}

export async function sendMailWithAttachment(options: SendMailOptions) {
  const { to, subject, text, filename, bytes } = options;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject,
    text,
    attachments: [
      {
        filename,
        content: bytes,
      },
    ],
  });
}
