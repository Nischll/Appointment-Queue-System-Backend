/**
 * Email configuration from environment.
 * When SMTP is not configured, email sending is no-op (app continues to work).
 */

const getMailConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "noreply@aqms.local";

  const enabled = Boolean(host && user && pass);

  return {
    enabled,
    host: host || "localhost",
    port,
    secure,
    auth: enabled ? { user, pass } : undefined,
    from: typeof from === "string" ? from : "noreply@aqms.local",
    /** Frontend login URL for "Login here" links in emails */
    loginUrl: process.env.APP_LOGIN_URL || "http://localhost:3000/login",
    /** Display name of the system in emails */
    appName: process.env.APP_NAME || "AQMS",
  };
};

export default getMailConfig;
