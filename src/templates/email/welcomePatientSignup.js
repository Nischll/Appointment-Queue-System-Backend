import { emailLayout, escapeHtml } from "./layout.js";

/**
 * Welcome email for patient self-registration.
 * Does not include password (user chose it during signup).
 */
export const welcomePatientSignupTemplate = (options) => {
  const { appName, loginUrl, fullName, username, email } = options;
  const name = escapeHtml(fullName || "Patient");
  const un = escapeHtml(username);
  const em = escapeHtml(email);

  const content = `
    <p>Hello ${name},</p>
    <p>Welcome to ${escapeHtml(appName)}. Your account has been created successfully.</p>
    <p><strong>Login credentials</strong></p>
    <dl class="credentials">
      <dt>Username</dt>
      <dd>${un}</dd>
      <dt>Email</dt>
      <dd>${em}</dd>
    </dl>
    <p>Use the password you set during registration to sign in.</p>
    <p><a href="${escapeHtml(loginUrl)}" class="btn">Sign in to your account</a></p>
    <div class="security">
      <strong>Security tip:</strong> Please change your password after your first login from your profile or account settings.
    </div>
    <p>If you did not create this account, please contact support.</p>
  `;

  return emailLayout(appName, content, "Welcome to " + appName);
};
