/**
 * Normalize date to YYYY-MM-DD string (for DB Date or string input).
 */
function toDateString(appointmentDate) {
  if (!appointmentDate) return "";
  if (typeof appointmentDate === "object" && appointmentDate instanceof Date) {
    const y = appointmentDate.getFullYear();
    const m = String(appointmentDate.getMonth() + 1).padStart(2, "0");
    const d = String(appointmentDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(appointmentDate).trim();
}

/**
 * Validates that an appointment slot (date + optional time) is not in the past.
 * Used to block booking, update, approve, and reschedule for past date/time.
 *
 * @param {string|Date} appointmentDate - Date string YYYY-MM-DD or Date object
 * @param {string|null|undefined} scheduledStartTime - Time string (HH:MM or HH:MM:SS), or null/undefined for date-only
 * @returns {boolean} - true if the slot is in the past (invalid)
 */
export function isAppointmentInPast(appointmentDate, scheduledStartTime) {
  const dateStr = toDateString(appointmentDate);
  if (!dateStr) return true;

  const timeStr =
    scheduledStartTime != null && scheduledStartTime !== ""
      ? String(scheduledStartTime).trim()
      : "00:00:00";

  // Normalize time to HH:MM:SS for parsing (e.g. "09:30" -> "09:30:00")
  const timeParts = timeStr.split(":");
  const normalizedTime =
    timeParts.length >= 2
      ? `${timeParts[0].padStart(2, "0")}:${timeParts[1].padStart(2, "0")}:${(timeParts[2] || "00").padStart(2, "0")}`
      : "00:00:00";

  let appointmentMoment;
  try {
    appointmentMoment = new Date(`${dateStr}T${normalizedTime}`);
    if (Number.isNaN(appointmentMoment.getTime())) return true;
  } catch {
    return true;
  }

  const now = new Date();
  return appointmentMoment.getTime() < now.getTime();
}

/**
 * Throws an error with statusCode 400 if the appointment slot is in the past.
 */
export function assertNotInPast(appointmentDate, scheduledStartTime) {
  if (isAppointmentInPast(appointmentDate, scheduledStartTime)) {
    const error = new Error(
      "Appointment date and time cannot be in the past. Please select a current or future date and time."
    );
    error.statusCode = 400;
    throw error;
  }
}

/**
 * Returns true if the given calendar date (YYYY-MM-DD) is before today.
 * Used for APIs that should not accept past dates (e.g. doctor-schedule).
 */
export function isDateInPast(dateStr) {
  if (!dateStr) return true;
  const normalized = toDateString(
    typeof dateStr === "string" ? dateStr.trim() : dateStr
  );
  if (!normalized) return true;
  const now = new Date();
  const today =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return normalized < today;
}

/**
 * Throws with statusCode 400 if the given date is in the past.
 */
export function assertDateNotInPast(dateStr) {
  if (isDateInPast(dateStr)) {
    const error = new Error(
      "Past date is not allowed. Please select today or a future date."
    );
    error.statusCode = 400;
    throw error;
  }
}
