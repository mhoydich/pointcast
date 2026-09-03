export interface MailEnv {
  RESEND_API_KEY?: string;
  SEND_EMAIL?: SendEmail;
}

export interface MailMessage {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
}

export type MailResult =
  | { configured: false }
  | { configured: true; provider: 'resend' | 'send_email'; messageId: string | null };

function bindingAddress(value: string): string | { email: string; name: string } {
  const match = value.match(/^\s*(.*?)\s*<([^<>]+)>\s*$/u);
  if (!match) return value.trim();
  return { name: match[1].trim(), email: match[2].trim() };
}

export async function sendMail(
  message: MailMessage,
  env: MailEnv,
  fetcher: typeof fetch = fetch,
): Promise<MailResult> {
  if (env.RESEND_API_KEY) {
    const response = await fetcher('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    if (!response.ok) throw new Error(`resend-send-failed:${response.status}`);
    const payload: unknown = await response.json();
    const messageId = payload && typeof payload === 'object' && 'id' in payload && typeof payload.id === 'string'
      ? payload.id
      : null;
    return { configured: true, provider: 'resend', messageId };
  }

  if (env.SEND_EMAIL) {
    const result = await env.SEND_EMAIL.send({
      from: bindingAddress(message.from),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      headers: message.headers,
    });
    return { configured: true, provider: 'send_email', messageId: result.messageId ?? null };
  }

  return { configured: false };
}
