import { Resend } from "resend";

interface SendMailParams {
  to: string;
  subject: string;
  text: string;
  pdfBytes: Buffer;
  filename: string;
}

export async function sendResultMail(params: SendMailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    console.warn("Resend設定が見つからないため、メール送信をスキップします");
    return;
  }

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      attachments: [
        {
          filename: params.filename,
          content: params.pdfBytes,
        },
      ],
    });
    console.log(`メール送信成功: ${params.to}`);
  } catch (error) {
    console.error("メール送信エラー:", error);
    throw new Error("メール送信に失敗しました");
  }
}
