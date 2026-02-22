import { emailLayout, escapeHtml } from "./layout.js";

/**
 * Welcome email when a patient is created by Admin (manual creation).
 * Includes temporary password; must be sent only at creation time (plain password from DTO).
 */
export const welcomePatientCreatedByAdminTemplate = (options) => {
  const { appName, loginUrl, fullName, username, email, temporaryPassword } = options;
  const name = escapeHtml(fullName || "Patient");
  const un = escapeHtml(username);
  const em = escapeHtml(email);
  const pw = escapeHtml(temporaryPassword);

  const content = `
    <p>Hello ${name},</p>
    <p>An account has been created for you on ${escapeHtml(appName)} by our team. You can now sign in using the credentials below.</p>
    <p><strong>Login credentials</strong></p>
    <dl class="credentials">
      <dt>Username</dt>
      <dd>${un}</dd>
      <dt>Email</dt>
      <dd>${em}</dd>
      <dt>Temporary password</dt>
      <dd>${pw}</dd>
    </dl>
    <p><a href="${escapeHtml(loginUrl)}" class="btn">Sign in to your account</a></p>
    <div class="security">
      <strong>Important:</strong> Please change your password after your first login for security.
    </div>
    <p>If you did not expect this email, please contact the clinic or support.</p>
  `;

  return emailLayout(appName, content, "Your " + appName + " account is ready");
};
