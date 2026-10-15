import type { NotificationType } from "@proofline/shared-types";

interface NotificationEmailInput {
  type: NotificationType;
  title: string;
  body?: string | null;
  url: string;
}

const CTA_LABEL: Record<NotificationType, string> = {
  CASE_ASSIGNED: "Open case",
  CASE_SENT_TO_SUPPLIER: "Review the case",
  SUPPLIER_RESPONDED: "View the response",
  RESOLUTION_PROPOSED: "Review the proposal",
  RESOLUTION_APPROVED: "Open case",
  CASE_CLOSED: "Open case",
};

const INTRO: Record<NotificationType, string> = {
  CASE_ASSIGNED: "A delivery dispute case has been assigned to you.",
  CASE_SENT_TO_SUPPLIER: "Your buyer has shared a delivery discrepancy case with you. Please review and respond.",
  SUPPLIER_RESPONDED: "The supplier has responded to a case you are responsible for.",
  RESOLUTION_PROPOSED: "A resolution has been proposed on a case you are responsible for.",
  RESOLUTION_APPROVED: "A resolution you proposed has been approved.",
  CASE_CLOSED: "A dispute case has been closed.",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Branded, table-based HTML email (inline styles for client compatibility).
 * Proofline palette: evergreen #176B52, ink #17211D, subtle #66736C, app bg #F5F7F5.
 */
export function renderNotificationEmail(input: NotificationEmailInput): { subject: string; html: string; text: string } {
  const title = input.title;
  const intro = INTRO[input.type];
  const cta = CTA_LABEL[input.type];
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeBody = input.body ? escapeHtml(input.body) : "";
  const safeUrl = input.url;

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F5F7F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#17211D;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F7F5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#FFFFFF;border:1px solid #E1E7E2;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px 0 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:34px;">
                      <div style="width:34px;height:34px;border-radius:9px;background-color:#176B52;"></div>
                    </td>
                    <td style="padding-left:10px;font-size:18px;font-weight:700;color:#17211D;">Proofline</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 0 28px;">
                <h1 style="margin:0;font-size:20px;line-height:1.3;color:#17211D;">${safeTitle}</h1>
                <p style="margin:12px 0 0 0;font-size:14px;line-height:1.6;color:#66736C;">${safeIntro}</p>
                ${safeBody ? `<p style="margin:12px 0 0 0;font-size:14px;line-height:1.6;color:#66736C;">${safeBody}</p>` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 8px 28px;">
                <a href="${safeUrl}" style="display:inline-block;background-color:#176B52;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:10px;">${cta}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 0 28px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#8A968F;">
                  Or open this link: <a href="${safeUrl}" style="color:#176B52;text-decoration:underline;">${safeUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px 28px;">
                <div style="border-top:1px solid #E1E7E2;padding-top:14px;font-size:12px;line-height:1.6;color:#8A968F;">
                  Sent by Proofline — supplier delivery discrepancy and dispute resolution.<br />
                  Every delivery. Every discrepancy. Proven.
                </div>
              </td>
            </tr>
          </table>
          <p style="max-width:520px;margin:14px auto 0 auto;font-size:11px;line-height:1.6;color:#A7B0AA;text-align:center;">
            You are receiving this because you are part of a Proofline workspace.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [title, "", intro, safeBody ? `${safeBody}\n` : "", `${cta}: ${safeUrl}`, "", "— Proofline"].join("\n");

  return { subject: title, html, text };
}
