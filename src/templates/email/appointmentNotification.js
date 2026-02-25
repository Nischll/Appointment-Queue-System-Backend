import { emailLayout, escapeHtml } from "./layout.js";

/**
 * Format time for display (e.g. "14:30" -> "2:30 PM").
 */
function formatTime(timeStr) {
  if (!timeStr) return "";
  const s = String(timeStr);
  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return escapeHtml(s);
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

function appointmentDetailsHtml(details) {
  const {
    patient_name,
    clinic_name,
    department_name,
    doctor_name,
    appointment_date,
    scheduled_start_time,
    preferred_time,
    appointment_type,
    queue_number,
  } = details;
  const name = escapeHtml(patient_name || "Patient");
  const clinic = escapeHtml(clinic_name || "—");
  const dept = escapeHtml(department_name || "—");
  const doctor = escapeHtml(doctor_name || "—");
  const date = escapeHtml(appointment_date || "—");
  const time = scheduled_start_time ? formatTime(scheduled_start_time) : (preferred_time ? escapeHtml(preferred_time) : "—");
  const type = escapeHtml(appointment_type || "—");
  const queue = queue_number != null ? escapeHtml(String(queue_number)) : "—";

  return `
    <dl class="credentials">
      <dt>Patient</dt>
      <dd>${name}</dd>
      <dt>Clinic</dt>
      <dd>${clinic}</dd>
      <dt>Department</dt>
      <dd>${dept}</dd>
      <dt>Doctor</dt>
      <dd>${doctor}</dd>
      <dt>Date</dt>
      <dd>${date}</dd>
      <dt>Time</dt>
      <dd>${time}</dd>
      <dt>Type</dt>
      <dd>${type}</dd>
      ${queue_number != null ? `<dt>Queue #</dt><dd>${queue}</dd>` : ""}
    </dl>
  `;
}

/**
 * Appointment booked (by staff) or approved (patient request → approved).
 */
export const appointmentBookedTemplate = (options) => {
  const { appName, loginUrl, ...details } = options;
  const content = `
    <p>Hello ${escapeHtml(details.patient_name || "Patient")},</p>
    <p>Your appointment has been confirmed at ${escapeHtml(appName)}.</p>
    <p><strong>Appointment details</strong></p>
    ${appointmentDetailsHtml(details)}
    <p>Please arrive on time. If you need to reschedule or cancel, please contact the clinic.</p>
    <p><a href="${escapeHtml(loginUrl)}" class="btn">View your appointments</a></p>
  `;
  return emailLayout(appName, content, "Appointment confirmed");
};

/**
 * Patient submitted a request (status = REQUESTED); awaiting approval.
 */
export const appointmentRequestReceivedTemplate = (options) => {
  const { appName, loginUrl, ...details } = options;
  const content = `
    <p>Hello ${escapeHtml(details.patient_name || "Patient")},</p>
    <p>We have received your appointment request at ${escapeHtml(appName)}.</p>
    <p><strong>Request details</strong></p>
    ${appointmentDetailsHtml(details)}
    <p>Our staff will review your request and confirm your appointment. You will receive another email once it is approved or if we need to suggest a different time.</p>
    <p><a href="${escapeHtml(loginUrl)}" class="btn">View your appointments</a></p>
  `;
  return emailLayout(appName, content, "Appointment request received");
};

/**
 * Appointment approved (patient had requested → now approved with date/time/doctor).
 */
export const appointmentApprovedTemplate = (options) => {
  return appointmentBookedTemplate(options);
};

/**
 * Appointment rejected by staff.
 */
export const appointmentRejectedTemplate = (options) => {
  const { appName, loginUrl, cancellation_reason, ...details } = options;
  const reason = escapeHtml(cancellation_reason || "Not specified");
  const content = `
    <p>Hello ${escapeHtml(details.patient_name || "Patient")},</p>
    <p>Your appointment request at ${escapeHtml(appName)} could not be approved.</p>
    <p><strong>Request details</strong></p>
    ${appointmentDetailsHtml(details)}
    <p><strong>Reason</strong></p>
    <p>${reason}</p>
    <p>Please submit a new request with a different date or time, or contact the clinic for assistance.</p>
    <p><a href="${escapeHtml(loginUrl)}" class="btn">Book another appointment</a></p>
  `;
  return emailLayout(appName, content, "Appointment request update");
};

/**
 * Appointment cancelled (by staff or system).
 */
export const appointmentCancelledTemplate = (options) => {
  const { appName, loginUrl, cancellation_reason, ...details } = options;
  const reason = escapeHtml(cancellation_reason || "Cancelled");
  const content = `
    <p>Hello ${escapeHtml(details.patient_name || "Patient")},</p>
    <p>Your appointment at ${escapeHtml(appName)} has been cancelled.</p>
    <p><strong>Appointment details</strong></p>
    ${appointmentDetailsHtml(details)}
    <p><strong>Reason</strong></p>
    <p>${reason}</p>
    <p>If you need to book again, please visit the portal or contact the clinic.</p>
    <p><a href="${escapeHtml(loginUrl)}" class="btn">Book another appointment</a></p>
  `;
  return emailLayout(appName, content, "Appointment cancelled");
};

/**
 * Appointment rescheduled (date/time/doctor changed).
 */
export const appointmentRescheduledTemplate = (options) => {
  const { appName, loginUrl, ...details } = options;
  const content = `
    <p>Hello ${escapeHtml(details.patient_name || "Patient")},</p>
    <p>Your appointment at ${escapeHtml(appName)} has been rescheduled.</p>
    <p><strong>Updated appointment details</strong></p>
    ${appointmentDetailsHtml(details)}
    <p>Please make a note of the new date and time.</p>
    <p><a href="${escapeHtml(loginUrl)}" class="btn">View your appointments</a></p>
  `;
  return emailLayout(appName, content, "Appointment rescheduled");
};

/**
 * Follow-up appointment created for the patient.
 */
export const appointmentFollowUpCreatedTemplate = (options) => {
  const { appName, loginUrl, ...details } = options;
  const content = `
    <p>Hello ${escapeHtml(details.patient_name || "Patient")},</p>
    <p>A follow-up appointment has been scheduled for you at ${escapeHtml(appName)}.</p>
    <p><strong>Appointment details</strong></p>
    ${appointmentDetailsHtml(details)}
    <p>Please arrive on time. Contact the clinic if you need to reschedule.</p>
    <p><a href="${escapeHtml(loginUrl)}" class="btn">View your appointments</a></p>
  `;
  return emailLayout(appName, content, "Follow-up appointment scheduled");
};

/**
 * Appointment marked as no-show.
 */
export const appointmentNoShowTemplate = (options) => {
  const { appName, loginUrl, ...details } = options;
  const content = `
    <p>Hello ${escapeHtml(details.patient_name || "Patient")},</p>
    <p>Your appointment at ${escapeHtml(appName)} was marked as no-show because you did not attend.</p>
    <p><strong>Appointment details</strong></p>
    ${appointmentDetailsHtml(details)}
    <p>If you need to reschedule, please book a new appointment or contact the clinic.</p>
    <p><a href="${escapeHtml(loginUrl)}" class="btn">Book another appointment</a></p>
  `;
  return emailLayout(appName, content, "Appointment marked as no-show");
};
