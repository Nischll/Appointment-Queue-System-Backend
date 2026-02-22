/**
 * Base HTML layout for system emails.
 * @param {string} appName - Application display name
 * @param {string} content - Inner HTML body content
 * @param {string} [preheader] - Optional short preview text for inbox
 */
export const emailLayout = (appName, content, preheader = "") => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  ${preheader ? `<meta name="description" content="${preheader.replace(/"/g, "&quot;")}" />` : ""}
  <title>${appName}</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background: #f4f4f5; color: #18181b; line-height: 1.6; }
    .wrapper { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); color: #fff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
    .body { padding: 28px 24px; }
    .body p { margin: 0 0 16px; }
    .credentials { background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0; font-family: ui-monospace, monospace; font-size: 0.9rem; }
    .credentials dt { font-weight: 600; color: #3f3f46; margin-top: 8px; }
    .credentials dt:first-child { margin-top: 0; }
    .credentials dd { margin: 4px 0 0; color: #52525b; }
    .btn { display: inline-block; background: #0d9488; color: #fff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .btn:hover { background: #0f766e; }
    .footer { padding: 20px 24px; font-size: 0.85rem; color: #71717a; border-top: 1px solid #e4e4e7; }
    .security { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0; font-size: 0.9rem; }
    ul { margin: 0 0 16px; padding-left: 20px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header"><h1>${escapeHtml(appName)}</h1></div>
      <div class="body">${content}</div>
      <div class="footer">
        This is an automated message from ${escapeHtml(appName)}. Please do not reply to this email.
      </div>
    </div>
  </div>
</body>
</html>`;
};

function escapeHtml(text) {
  if (text == null) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(text).replace(/[&<>"']/g, (c) => map[c]);
}

export { escapeHtml };
