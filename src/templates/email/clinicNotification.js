import { emailLayout, escapeHtml } from "./layout.js";

/**
 * Format time for display.
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

/**
 * Clinic notification: new appointment request from a patient.
 * Staff can use the link to log in and approve/reject.
 */
export const clinicAppointmentRequestTemplate = (options) => {
  const { appName, loginUrl, patient_name, patient_email, clinic_name, department_name, doctor_name, appointment_date, preferred_time, notes, appointment_type } = options;
  const name = escapeHtml(patient_name || "Patient");
  const email = escapeHtml(patient_email || "—");
  const clinic = escapeHtml(clinic_name || "—");
  const dept = escapeHtml(department_name || "—");
  const doctor = escapeHtml(doctor_name || "—");
  const date = escapeHtml(appointment_date || "—");
  const time = preferred_time ? formatTime(preferred_time) : (preferred_time ? escapeHtml(preferred_time) : "—");
  const type = escapeHtml(appointment_type || "—");
  const notesHtml = notes ? `<p><strong>Notes from patient</strong><br/>${escapeHtml(notes)}</p>` : "";

  const content = `
    <p>A patient has requested an appointment and is awaiting approval.</p>
    <p><strong>Request details</strong></p>
    <dl class="credentials">
      <dt>Patient name</dt>
      <dd>${name}</dd>
      <dt>Patient email</dt>
      <dd>${email}</dd>
      <dt>Clinic</dt>
      <dd>${clinic}</dd>
      <dt>Department</dt>
      <dd>${dept}</dd>
      <dt>Preferred doctor</dt>
      <dd>${doctor}</dd>
      <dt>Preferred date</dt>
      <dd>${date}</dd>
      <dt>Preferred time</dt>
      <dd>${time}</dd>
      <dt>Type</dt>
      <dd>${type}</dd>
    </dl>
    ${notesHtml}
    <p><a href="${escapeHtml(loginUrl)}" class="btn">Sign in to review and approve</a></p>
  `;
  return emailLayout(appName, content, "New appointment request from " + name);
};

/**
 * Clinic notification: new patient self-signup.
 */
export const clinicNewPatientSignupTemplate = (options) => {
  const { appName, loginUrl, fullName, username, email } = options;
  const name = escapeHtml(fullName || "Patient");
  const un = escapeHtml(username);
  const em = escapeHtml(email || "—");

  const content = `
    <p>A new patient has registered on ${escapeHtml(appName)}.</p>
    <p><strong>Details</strong></p>
    <dl class="credentials">
      <dt>Name</dt>
      <dd>${name}</dd>
      <dt>Username</dt>
      <dd>${un}</dd>
      <dt>Email</dt>
      <dd>${em}</dd>
    </dl>
    <p><a href="${escapeHtml(loginUrl)}" class="btn">Sign in to staff portal</a></p>
  `;
  return emailLayout(appName, content, "New patient registration: " + name);
};
