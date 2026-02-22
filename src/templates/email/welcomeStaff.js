import { emailLayout, escapeHtml } from "./layout.js";

/**
 * Welcome/onboarding email when a staff member is added by Admin/Superadmin.
 * Includes login credentials and basic onboarding instructions.
 */
export const welcomeStaffTemplate = (options) => {
  const { appName, loginUrl, fullName, username, email, temporaryPassword } = options;
  const name = escapeHtml(fullName || "Staff");
  const un = escapeHtml(username);
  const em = escapeHtml(email);
  const pw = escapeHtml(temporaryPassword);

  const content = `
    <p>Hello ${name},</p>
    <p>You have been added as a staff member to ${escapeHtml(appName)}. Below are your login credentials and a few steps to get started.</p>
    <p><strong>Login credentials</strong></p>
    <dl class="credentials">
      <dt>Username</dt>
      <dd>${un}</dd>
      <dt>Email</dt>
      <dd>${em}</dd>
      <dt>Temporary password</dt>
      <dd>${pw}</dd>
    </dl>
    <p><a href="${escapeHtml(loginUrl)}" class="btn">Sign in to staff portal</a></p>
    <div class="security">
      <strong>Security:</strong> Please change your password after your first login. Do not share your credentials with anyone.
    </div>
    <p><strong>Onboarding</strong></p>
    <ul>
      <li>Sign in using the link above and change your password.</li>
      <li>Complete your profile if prompted.</li>
      <li>Contact your administrator if you need access to additional modules or clinics.</li>
    </ul>
    <p>If you did not expect this email, please contact your administrator.</p>
  `;

  return emailLayout(appName, content, "Your " + appName + " staff account");
};
