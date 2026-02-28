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
 * Converts a time string to 24-hour HH:MM:SS.
 * Accepts: "11:00 AM", "2:30 PM", "09:30" (24h), "14:45:00" (24h).
 * Use when validating or before sending time to the DB so 12-hour format is handled.
 */
export function to24HourTime(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return "00:00:00";
  const s = timeStr.trim().toUpperCase();
  const am = s.endsWith(" AM");
  const pm = s.endsWith(" PM");
  if (am || pm) {
    const withoutAmPm = (am ? s.slice(0, -3) : s.slice(0, -3)).trim();
    const parts = withoutAmPm.split(":");
    const hour = parseInt(parts[0], 10);
    const min = parseInt(parts[1], 10) || 0;
    const sec = parseInt(parts[2], 10) || 0;
    if (Number.isNaN(hour)) return "00:00:00";
    let h24 = hour;
    if (am && hour === 12) h24 = 0;
    else if (pm && hour !== 12) h24 = hour + 12;
    return `${String(h24).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  // Already 24h: "09:30" or "14:45:00"
  const parts = s.split(":");
  if (parts.length >= 2) {
    const h = String(parseInt(parts[0], 10) || 0).padStart(2, "0");
    const m = String(parseInt(parts[1], 10) || 0).padStart(2, "0");
    const sec = (parts[2] != null && parts[2].trim() !== "") ? String(parseInt(parts[2], 10) || 0).padStart(2, "0") : "00";
    return `${h}:${m}:${sec}`;
  }
  return "00:00:00";
}

/**
 * Validates that an appointment slot (date + optional time) is not in the past.
 * Used to block booking, update, approve, and reschedule for past date/time.
 *
 * @param {string|Date} appointmentDate - Date string YYYY-MM-DD or Date object
 * @param {string|null|undefined} scheduledStartTime - Time string (e.g. "11:00 AM", "09:30", "14:00:00"), or null/undefined for date-only
 * @returns {boolean} - true if the slot is in the past (invalid)
 */
export function isAppointmentInPast(appointmentDate, scheduledStartTime) {
  const dateStr = toDateString(appointmentDate);
  if (!dateStr) return true;

  const timeStr =
    scheduledStartTime != null && scheduledStartTime !== ""
      ? String(scheduledStartTime).trim()
      : "00:00:00";

  const normalizedTime = to24HourTime(timeStr);

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
