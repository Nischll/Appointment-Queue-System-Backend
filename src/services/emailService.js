import nodemailer from "nodemailer";
import getMailConfig from "../config/mail.js";
import { welcomePatientSignupTemplate } from "../templates/email/welcomePatientSignup.js";
import { welcomePatientCreatedByAdminTemplate } from "../templates/email/welcomePatientCreatedByAdmin.js";
import { welcomeStaffTemplate } from "../templates/email/welcomeStaff.js";
import {
  appointmentBookedTemplate,
  appointmentRequestReceivedTemplate,
  appointmentRejectedTemplate,
  appointmentCancelledTemplate,
  appointmentRescheduledTemplate,
  appointmentFollowUpCreatedTemplate,
  appointmentNoShowTemplate,
} from "../templates/email/appointmentNotification.js";
import {
  clinicAppointmentRequestTemplate,
  clinicNewPatientSignupTemplate,
} from "../templates/email/clinicNotification.js";

/** In-memory queue for non-blocking email sends (optional). */
const emailQueue = [];
let isProcessing = false;

function processQueue() {
  if (isProcessing || emailQueue.length === 0) return;
  isProcessing = true;
  const task = emailQueue.shift();
  task()
    .catch((err) => console.error("[Email] Queue send failed:", err))
    .finally(() => {
      isProcessing = false;
      if (emailQueue.length > 0) setImmediate(processQueue);
    });
}

/**
 * Queue an email send so the main request is not blocked.
 * @param {() => Promise<void>} sendFn - Async function that performs the send (no args).
 */
export function queueEmail(sendFn) {
  if (typeof sendFn !== "function") return;
  emailQueue.push(sendFn);
  setImmediate(processQueue);
}

/**
 * Get nodemailer transporter. Returns null if email is disabled.
 */
function getTransporter() {
  const config = getMailConfig();
  if (!config.enabled) return null;
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
}

/**
 * Send an email. No-op if SMTP is not configured. Logs errors; does not throw.
 * @param {{ to: string; subject: string; html: string; from?: string }} options
 */
export async function sendMail(options) {
  const config = getMailConfig();
  if (!config.enabled) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[Email] SMTP not configured; skipping send to", options.to);
    }
    return;
  }

  const transporter = getTransporter();
  if (!transporter) return;

  try {
    await transporter.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } catch (err) {
    console.error("[Email] Send failed:", err.message);
    throw err;
  }
}

/**
 * Send welcome email after patient self-signup. Does not include password.
 * Safe to call with queueEmail for non-blocking behavior.
 */
export async function sendWelcomePatientSignup(payload) {
  const { to, fullName, username } = payload;
  if (!to) return;
  const config = getMailConfig();
  const html = welcomePatientSignupTemplate({
    appName: config.appName,
    loginUrl: config.loginUrl,
    fullName,
    username,
    email: to,
  });
  await sendMail({
    to,
    subject: `Welcome to ${config.appName}`,
    html,
  });
}

/**
 * Send welcome email when patient is created by Admin. Includes temporary password.
 * Only call at creation time with the plain password from the request (never hashed).
 */
export async function sendWelcomePatientCreatedByAdmin(payload) {
  const { to, fullName, username, temporaryPassword } = payload;
  if (!to || !temporaryPassword) return;
  const config = getMailConfig();
  const html = welcomePatientCreatedByAdminTemplate({
    appName: config.appName,
    loginUrl: config.loginUrl,
    fullName,
    username,
    email: to,
    temporaryPassword,
  });
  await sendMail({
    to,
    subject: `Your ${config.appName} account is ready`,
    html,
  });
}

/**
 * Send welcome/onboarding email when staff is added. Includes temporary password.
 * Only call at creation time with the plain password from the request (never hashed).
 */
export async function sendWelcomeStaff(payload) {
  const { to, fullName, username, temporaryPassword } = payload;
  if (!to || !temporaryPassword) return;
  const config = getMailConfig();
  const html = welcomeStaffTemplate({
    appName: config.appName,
    loginUrl: config.loginUrl,
    fullName,
    username,
    email: to,
    temporaryPassword,
  });
  await sendMail({
    to,
    subject: `Your ${config.appName} staff account`,
    html,
  });
}

/**
 * Send appointment notification to patient. Payload must include to (email) and appointment details.
 * Safe to call with queueEmail. No-op if `to` is missing.
 */
function buildAppointmentPayload(payload) {
  const config = getMailConfig();
  return {
    appName: config.appName,
    loginUrl: config.loginUrl,
    ...payload,
  };
}

/** Appointment booked by staff or approved (patient had requested). */
export async function sendAppointmentBooked(payload) {
  const { to, ...rest } = payload;
  if (!to) return;
  const html = appointmentBookedTemplate(buildAppointmentPayload(rest));
  const config = getMailConfig();
  await sendMail({
    to,
    subject: `Appointment confirmed – ${config.appName}`,
    html,
  });
}

/** Patient submitted a request; confirmation that we received it. */
export async function sendAppointmentRequestReceived(payload) {
  const { to, ...rest } = payload;
  if (!to) return;
  const html = appointmentRequestReceivedTemplate(buildAppointmentPayload(rest));
  const config = getMailConfig();
  await sendMail({
    to,
    subject: `Appointment request received – ${config.appName}`,
    html,
  });
}

/** Appointment request rejected by staff. */
export async function sendAppointmentRejected(payload) {
  const { to, ...rest } = payload;
  if (!to) return;
  const html = appointmentRejectedTemplate(buildAppointmentPayload(rest));
  const config = getMailConfig();
  await sendMail({
    to,
    subject: `Appointment request update – ${config.appName}`,
    html,
  });
}

/** Appointment cancelled. */
export async function sendAppointmentCancelled(payload) {
  const { to, ...rest } = payload;
  if (!to) return;
  const html = appointmentCancelledTemplate(buildAppointmentPayload(rest));
  const config = getMailConfig();
  await sendMail({
    to,
    subject: `Appointment cancelled – ${config.appName}`,
    html,
  });
}

/** Appointment rescheduled. */
export async function sendAppointmentRescheduled(payload) {
  const { to, ...rest } = payload;
  if (!to) return;
  const html = appointmentRescheduledTemplate(buildAppointmentPayload(rest));
  const config = getMailConfig();
  await sendMail({
    to,
    subject: `Appointment rescheduled – ${config.appName}`,
    html,
  });
}

/** Follow-up appointment created. */
export async function sendAppointmentFollowUpCreated(payload) {
  const { to, ...rest } = payload;
  if (!to) return;
  const html = appointmentFollowUpCreatedTemplate(buildAppointmentPayload(rest));
  const config = getMailConfig();
  await sendMail({
    to,
    subject: `Follow-up appointment scheduled – ${config.appName}`,
    html,
  });
}

/** Appointment marked as no-show. */
export async function sendAppointmentNoShow(payload) {
  const { to, ...rest } = payload;
  if (!to) return;
  const html = appointmentNoShowTemplate(buildAppointmentPayload(rest));
  const config = getMailConfig();
  await sendMail({
    to,
    subject: `Appointment marked as no-show – ${config.appName}`,
    html,
  });
}

// ——— Clinic notifications (sent to CLINIC_EMAIL when configured) ———

/** Notify clinic: new appointment request from patient. No-op if CLINIC_EMAIL not set. */
export async function sendClinicAppointmentRequest(payload) {
  const config = getMailConfig();
  if (!config.clinicEmail) return;
  const html = clinicAppointmentRequestTemplate({
    appName: config.appName,
    loginUrl: config.loginUrl,
    ...payload,
  });
  await sendMail({
    to: config.clinicEmail,
    subject: `[${config.appName}] New appointment request – ${payload.patient_name || "Patient"}`,
    html,
  });
}

/** Notify clinic: new patient self-signup. No-op if CLINIC_EMAIL not set. */
export async function sendClinicNewPatientSignup(payload) {
  const config = getMailConfig();
  if (!config.clinicEmail) return;
  const html = clinicNewPatientSignupTemplate({
    appName: config.appName,
    loginUrl: config.loginUrl,
    ...payload,
  });
  await sendMail({
    to: config.clinicEmail,
    subject: `[${config.appName}] New patient registration – ${payload.fullName || "Patient"}`,
    html,
  });
}
