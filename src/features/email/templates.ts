import { site } from "@/content/site";

/*
 * Email templates. Every value inserted into HTML is escaped. Layout uses
 * tables and inline styles for compatibility with email clients.
 */

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strips characters that could break a subject line or inject headers. */
const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, " ").trim();

interface Footer {
  contactEmail?: string;
}

function layout(opts: { preheader: string; heading: string; bodyHtml: string; footer?: Footer }): string {
  const contact = opts.footer?.contactEmail
    ? `Questions? Contact <a href="mailto:${escapeHtml(opts.footer.contactEmail)}" style="color:#3a43ee">${escapeHtml(opts.footer.contactEmail)}</a>.<br>`
    : "";
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(opts.heading)}</title></head>
<body style="margin:0;padding:0;background:#f7f8fb;font-family:Arial,Helvetica,sans-serif;color:#151927">
<span style="display:none;max-height:0;overflow:hidden">${escapeHtml(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8fb;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #dde1ec;border-radius:16px;overflow:hidden">
<tr><td style="background:#0b0e19;padding:20px 28px">
<span style="display:inline-block;background:#4c5efa;color:#fff;font-weight:bold;font-size:18px;border-radius:8px;padding:4px 10px">A</span>
<span style="color:#fff;font-weight:bold;font-size:18px;margin-left:8px;vertical-align:middle">${escapeHtml(site.name)}</span>
<span style="color:#8e96ae;font-size:12px;margin-left:6px;vertical-align:middle">${escapeHtml(site.fullName)}</span>
</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0b0e19">${escapeHtml(opts.heading)}</h1>
${opts.bodyHtml}
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #eef0f6;font-size:12px;line-height:1.6;color:#646c86">
${contact}${escapeHtml(site.fullName)}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

const p = (html: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">${html}</p>`;
const note = (html: string) =>
  `<p style="margin:18px 0 0;padding:12px 14px;background:#f0f4ff;border:1px solid #c4d1ff;border-radius:10px;font-size:13px;line-height:1.5;color:#181a4d">${html}</p>`;
const button = (href: string, label: string) =>
  `<p style="margin:20px 0 4px"><a href="${escapeHtml(href)}" style="display:inline-block;background:#3a43ee;color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:11px 18px;border-radius:10px">${escapeHtml(label)}</a></p>`;

export const NOT_AN_APPLICATION_TEXT =
  "Please note: registering interest is not an application for admission. It does not reserve a place and creates no commitment for you or for AIDA.";

// ---------------------------------------------------------------------------

export function registrantConfirmation(input: { fullName: string; programmeTitle?: string | null; footer?: Footer }): RenderedEmail {
  const first = oneLine(input.fullName).split(" ")[0] || "there";
  const programmeLine = input.programmeTitle
    ? `You told us you are interested in <strong>${escapeHtml(input.programmeTitle)}</strong>.`
    : "";
  const subject = `Thank you for registering your interest in ${site.name}`;
  const html = layout({
    preheader: "We have received your registration of interest.",
    heading: "We have received your registration of interest",
    footer: input.footer,
    bodyHtml: [
      p(`Hello ${escapeHtml(first)},`),
      p(`Thank you for registering your interest in ${escapeHtml(site.fullName)}. We will contact you by email when there is news to share.`),
      programmeLine ? p(programmeLine) : "",
      note(escapeHtml(NOT_AN_APPLICATION_TEXT)),
      p(
        `<span style="font-size:13px;color:#646c86">If you did not register, you can ignore this email, or ask us to delete your details at any time.</span>`,
      ),
    ].join("\n"),
  });
  const text = [
    `Hello ${first},`,
    "",
    `Thank you for registering your interest in ${site.fullName}. We will contact you by email when there is news to share.`,
    input.programmeTitle ? `\nYou told us you are interested in: ${oneLine(input.programmeTitle)}.` : "",
    "",
    NOT_AN_APPLICATION_TEXT,
    "",
    "If you did not register, you can ignore this email, or ask us to delete your details at any time.",
    input.footer?.contactEmail ? `\nQuestions? Contact ${input.footer.contactEmail}.` : "",
    "",
    site.fullName,
  ]
    .filter((l) => l !== null)
    .join("\n");
  return { subject, html, text };
}

export function staffAlert(input: {
  fullName: string;
  learnerTypeLabel: string;
  programmeTitle?: string | null;
  adminUrl: string;
}): RenderedEmail {
  const name = oneLine(input.fullName);
  const subject = oneLine(`New registration of interest: ${name}`).slice(0, 200);
  const rows = [
    ["Name", name],
    ["Describes themselves as", input.learnerTypeLabel],
    ["Programme", input.programmeTitle ?? "None selected"],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;font-size:13px;color:#646c86;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:6px 0;font-size:14px">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  const html = layout({
    preheader: `${name} registered interest.`,
    heading: "New registration of interest",
    bodyHtml: [
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px">${rows}</table>`,
      button(input.adminUrl, "View in admin"),
      p(`<span style="font-size:12px;color:#646c86">Contact details are available in the admin area only.</span>`),
    ].join("\n"),
  });
  const text = [
    "New registration of interest",
    "",
    `Name: ${name}`,
    `Describes themselves as: ${input.learnerTypeLabel}`,
    `Programme: ${input.programmeTitle ?? "None selected"}`,
    "",
    `View in admin: ${input.adminUrl}`,
  ].join("\n");
  return { subject, html, text };
}

/** Daily summary — counts only, no personal data. */
export function staffDigest(input: {
  total: number;
  byType: Array<{ label: string; count: number }>;
  dateLabel: string;
  adminUrl: string;
}): RenderedEmail {
  const subject = `${site.name}: ${input.total} new registration${input.total === 1 ? "" : "s"} of interest`;
  const list = input.byType
    .filter((t) => t.count > 0)
    .map((t) => `<li style="margin:0 0 4px;font-size:14px">${escapeHtml(t.label)}: <strong>${t.count}</strong></li>`)
    .join("");
  const html = layout({
    preheader: `${input.total} new in the last 24 hours.`,
    heading: "Daily registrations summary",
    bodyHtml: [
      p(`<strong>${input.total}</strong> new registration${input.total === 1 ? "" : "s"} of interest in the 24 hours to ${escapeHtml(input.dateLabel)}.`),
      list ? `<ul style="margin:0 0 8px;padding-left:20px">${list}</ul>` : "",
      button(input.adminUrl, "Review registrations"),
    ].join("\n"),
  });
  const text = [
    "Daily registrations summary",
    "",
    `${input.total} new registration(s) of interest in the 24 hours to ${input.dateLabel}.`,
    ...input.byType.filter((t) => t.count > 0).map((t) => `- ${t.label}: ${t.count}`),
    "",
    `Review registrations: ${input.adminUrl}`,
  ].join("\n");
  return { subject, html, text };
}

export function testEmail(input: { recipientName: string; provider: string }): RenderedEmail {
  const html = layout({
    preheader: "Test message from the AIDA admin area.",
    heading: "Test email",
    bodyHtml: [
      p(`Hello ${escapeHtml(oneLine(input.recipientName))},`),
      p(`This is a test message from the ${escapeHtml(site.name)} admin area. If you can read it, email delivery is working.`),
      p(`<span style="font-size:12px;color:#646c86">Delivery mode: ${escapeHtml(input.provider)}</span>`),
    ].join("\n"),
  });
  return {
    subject: `${site.name} test email`,
    html,
    text: `Hello ${oneLine(input.recipientName)},\n\nThis is a test message from the ${site.name} admin area. If you can read it, email delivery is working.\n\nDelivery mode: ${input.provider}`,
  };
}
