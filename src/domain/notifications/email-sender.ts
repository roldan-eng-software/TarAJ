import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '465');
  const secure = process.env.EMAIL_SECURE === 'true';
  const user = process.env.EMAIL_FROM_ADDRESS;
  const pass = process.env.EMAIL_API_KEY;

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return _transporter;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM_ADDRESS || 'noreply@taraj.app';

  await transporter.sendMail({
    from: `"Sistema Jurídico" <${from}>`,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
