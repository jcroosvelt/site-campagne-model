import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env";

export type MailAttachment = { filename: string; content: Buffer; contentType?: string };

let transporter: Transporter | null = null;

export function isMailConfigured() {
  return Boolean(env.smtp().host);
}

/** Envoie un e-mail. Sans SMTP configuré, le message est journalisé (développement). Retourne true si envoyé. */
export async function sendMail(opts: { to: string; subject: string; text: string; html?: string; attachments?: MailAttachment[] }) {
  const cfg = env.smtp();
  if (!cfg.host) {
    console.info(`[mail:non-configuré] À: ${opts.to} — ${opts.subject}\n${opts.text}`);
    return false;
  }
  transporter ??= nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.password } : undefined,
  });
  try {
    await transporter.sendMail({ from: cfg.from, ...opts });
    return true;
  } catch (err) {
    console.error("[mail] échec d'envoi", err);
    return false;
  }
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Gabarit HTML sobre pour les e-mails transactionnels. */
export function mailLayout(title: string, paragraphs: string[], cta?: { label: string; url: string }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;line-height:1.6">${escapeHtml(p)}</p>`).join("");
  const button = cta
    ? `<p style="margin:24px 0"><a href="${escapeHtml(cta.url)}" style="background:#0b1f3a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">${escapeHtml(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f5f3ee;font-family:Arial,sans-serif;color:#1a2433">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
  <div style="border-top:4px solid #c8102e;background:#fff;padding:28px">
  <h1 style="font-family:Georgia,serif;font-size:22px;color:#0b1f3a;margin:0 0 18px">${escapeHtml(title)}</h1>
  ${body}${button}</div></div></body></html>`;
}
