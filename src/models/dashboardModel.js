import pool from "../config/db.js";
import APPOINTMENT_STATUS from "../enums/appointmentStatus.enum.js";

const VALID_TIMEFRAMES = ["daily", "weekly", "monthly", "yearly"];

/** Get date range for timeframe: { start, end, prevStart, prevEnd } (inclusive dates) */
export const getTimeframeBounds = (timeframe) => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start, prevStart, prevEnd;
  switch (timeframe) {
    case "daily": {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      prevEnd = new Date(start);
      prevEnd.setSeconds(-1);
      prevStart = new Date(prevEnd);
      prevStart.setHours(0, 0, 0, 0);
      break;
    }
    case "weekly": {
      start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      prevEnd = new Date(start);
      prevEnd.setSeconds(-1);
      prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - 6);
      prevStart.setHours(0, 0, 0, 0);
      break;
    }
    case "monthly": {
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      prevEnd = new Date(start);
      prevEnd.setSeconds(-1);
      prevStart = new Date(prevEnd);
      prevStart.setMonth(prevStart.getMonth() - 1);
      prevStart.setHours(0, 0, 0, 0);
      break;
    }
    case "yearly": {
      start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0, 0);
      prevEnd = new Date(start);
      prevEnd.setSeconds(-1);
      prevStart = new Date(prevEnd.getFullYear() - 1, prevEnd.getMonth(), prevEnd.getDate(), 0, 0, 0, 0);
      break;
    }
    default:
      throw new Error(`Invalid timeframe. Use one of: ${VALID_TIMEFRAMES.join(", ")}`);
  }
  return { start, end, prevStart, prevEnd };
};

export const isValidTimeframe = (tf) => VALID_TIMEFRAMES.includes(tf);

export const getAppointmentCountByStatusQuery = async (clinicId) => {
  const result = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE status = $1) AS requested,
      COUNT(*) FILTER (WHERE status = $2) AS booked,
      COUNT(*) FILTER (WHERE status = $3) AS checked_in,
      COUNT(*) FILTER (WHERE status = $4) AS in_progress,
      COUNT(*) FILTER (WHERE status = $5) AS completed,
      COUNT(*) FILTER (WHERE status = $6) AS no_show
    FROM appointments
    WHERE clinic_id = $7
      AND appointment_date = CURRENT_DATE
    `,
    [
      APPOINTMENT_STATUS.Requested,
      APPOINTMENT_STATUS.Booked,
      APPOINTMENT_STATUS.Checked_In,
      APPOINTMENT_STATUS.In_progress,
      APPOINTMENT_STATUS.Completed,
      APPOINTMENT_STATUS.No_Show,
      clinicId,
    ],
  );

  return result.rows[0];
};

/** Counts for dashboard summary (all-time and today). Optional clinicId filters appointment-based stats. */
export const getSummaryCountsQuery = async (clinicId = null) => {
  const hasClinic = clinicId != null;
  const apptCondition = hasClinic ? "AND clinic_id = $1" : "";
  const apptParams = hasClinic ? [clinicId] : [];

  const [patients, clinics, doctors, todayAppointments, pendingRequests, completedToday] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS c FROM users u WHERE u.user_type = 'EXTERNAL' AND u.isactive = TRUE`
    ),
    pool.query(`SELECT COUNT(*) AS c FROM clinics WHERE is_active = TRUE`),
    pool.query(`SELECT COUNT(*) AS c FROM doctors WHERE status = TRUE`),
    pool.query(
      `SELECT COUNT(*) AS c FROM appointments WHERE appointment_date = CURRENT_DATE AND status NOT IN ('CANCELLED', 'REJECTED') ${apptCondition}`,
      apptParams
    ),
    pool.query(
      `SELECT COUNT(*) AS c FROM appointments WHERE status = $1 AND appointment_date >= CURRENT_DATE ${apptCondition}`,
      hasClinic ? [APPOINTMENT_STATUS.Requested, clinicId] : [APPOINTMENT_STATUS.Requested]
    ),
    pool.query(
      `SELECT COUNT(*) AS c FROM appointments WHERE appointment_date = CURRENT_DATE AND status = $1 ${apptCondition}`,
      hasClinic ? [APPOINTMENT_STATUS.Completed, clinicId] : [APPOINTMENT_STATUS.Completed]
    ),
  ]);
  return {
    totalPatients: parseInt(patients.rows[0].c, 10),
    totalClinics: parseInt(clinics.rows[0].c, 10),
    totalDoctors: parseInt(doctors.rows[0].c, 10),
    todayAppointments: parseInt(todayAppointments.rows[0].c, 10),
    pendingRequests: parseInt(pendingRequests.rows[0].c, 10),
    completedToday: parseInt(completedToday.rows[0].c, 10),
  };
};

/** Count appointments in date range (excl. cancelled/rejected). Optional clinicId. */
export const getAppointmentCountInRangeQuery = async (startDate, endDate, clinicId = null) => {
  const hasClinic = clinicId != null;
  const r = await pool.query(
    `SELECT COUNT(*) AS c FROM appointments
     WHERE appointment_date >= $1 AND appointment_date <= $2
     AND status NOT IN ('CANCELLED', 'REJECTED')
     ${hasClinic ? "AND clinic_id = $3" : ""}`,
    hasClinic ? [startDate, endDate, clinicId] : [startDate, endDate]
  );
  return parseInt(r.rows[0].c, 10);
};

/** Human-readable labels for appointment types (for API response) */
export const APPOINTMENT_TYPE_LABELS = Object.freeze({
  COUNSELLING: "Counselling",
  REGULAR_CHECKUP: "Regular Checkup",
  FOLLOW_UP: "Follow Up",
  OPERATION: "Operation",
});

/** Count completed appointments in date range. Optional clinicId. */
export const getCompletedCountInRangeQuery = async (startDate, endDate, clinicId = null) => {
  const hasClinic = clinicId != null;
  const r = await pool.query(
    `SELECT COUNT(*) AS c FROM appointments
     WHERE appointment_date >= $1 AND appointment_date <= $2 AND status = $3
     ${hasClinic ? "AND clinic_id = $4" : ""}`,
    hasClinic ? [startDate, endDate, APPOINTMENT_STATUS.Completed, clinicId] : [startDate, endDate, APPOINTMENT_STATUS.Completed]
  );
  return parseInt(r.rows[0].c, 10);
};

/** Full dashboard summary with trend percentages. Optional clinicId. */
export const getSummaryDataQuery = async (timeframe, clinicId = null) => {
  const { start, end, prevStart, prevEnd } = getTimeframeBounds(timeframe);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  const prevStartStr = prevStart.toISOString().slice(0, 10);
  const prevEndStr = prevEnd.toISOString().slice(0, 10);

  const [
    counts,
    totalAppointments,
    prevTotalAppointments,
    completedInRange,
    prevCompletedInRange,
    patientsNow,
    patientsPrev,
    doctorsNow,
    doctorsPrev,
  ] = await Promise.all([
    getSummaryCountsQuery(clinicId),
    getAppointmentCountInRangeQuery(startStr, endStr, clinicId),
    getAppointmentCountInRangeQuery(prevStartStr, prevEndStr, clinicId),
    getCompletedCountInRangeQuery(startStr, endStr, clinicId),
    getCompletedCountInRangeQuery(prevStartStr, prevEndStr, clinicId),
    getPatientCountAsOfQuery(end),
    getPatientCountAsOfQuery(prevEnd),
    getDoctorCountAsOfQuery(end),
    getDoctorCountAsOfQuery(prevEnd),
  ]);

  const trend = (current, previous) =>
    previous === 0 ? (current === 0 ? 0 : 100) : Math.round(((current - previous) / previous) * 100);

  return {
    ...counts,
    totalAppointments,
    totalPatientsTrendPercent: trend(counts.totalPatients, patientsPrev),
    totalDoctorsTrendPercent: trend(counts.totalDoctors, doctorsPrev),
    totalAppointmentsTrendPercent: trend(totalAppointments, prevTotalAppointments),
    completedTrendPercent: trend(completedInRange, prevCompletedInRange),
  };
};

/** Patient count as of a given date (created_at <= date) */
export const getPatientCountAsOfQuery = async (date) => {
  const r = await pool.query(
    `SELECT COUNT(*) AS c FROM users u WHERE u.user_type = 'EXTERNAL' AND u.isactive = TRUE AND u.created_at <= $1`,
    [date]
  );
  return parseInt(r.rows[0].c, 10);
};

/** Doctor count as of a given date */
export const getDoctorCountAsOfQuery = async (date) => {
  const r = await pool.query(
    `SELECT COUNT(*) AS c FROM doctors WHERE status = TRUE AND created_at <= $1`,
    [date]
  );
  return parseInt(r.rows[0].c, 10);
};

/** Appointment types with counts in date range (for top appointment types). Optional clinicId. */
export const getAppointmentTypesByRangeQuery = async (startDate, endDate, clinicId = null) => {
  const hasClinic = clinicId != null;
  const result = await pool.query(
    `SELECT appointment_type AS type, COUNT(*)::int AS count
     FROM appointments
     WHERE appointment_date >= $1 AND appointment_date <= $2
     AND status NOT IN ('CANCELLED', 'REJECTED')
     AND appointment_type IS NOT NULL
     ${hasClinic ? "AND clinic_id = $3" : ""}
     GROUP BY appointment_type
     ORDER BY count DESC`,
    hasClinic ? [startDate, endDate, clinicId] : [startDate, endDate]
  );
  return result.rows;
};

/** Appointments grouped by period for chart. Optional clinicId. */
export const getAppointmentsChartQuery = async (timeframe, startDate, endDate, clinicId = null) => {
  const hasClinic = clinicId != null;
  const groupBy = {
    daily: "appointment_date::date",
    weekly: "'Week ' || TO_CHAR(appointment_date, 'IW')",
    monthly: "TO_CHAR(appointment_date, 'Mon YYYY')",
    yearly: "TO_CHAR(appointment_date, 'YYYY')",
  }[timeframe];
  const result = await pool.query(
    `SELECT ${groupBy} AS period, COUNT(*)::int AS count
     FROM appointments
     WHERE appointment_date >= $1 AND appointment_date <= $2
     AND status NOT IN ('CANCELLED', 'REJECTED')
     ${hasClinic ? "AND clinic_id = $3" : ""}
     GROUP BY ${groupBy}
     ORDER BY period`,
    hasClinic ? [startDate, endDate, clinicId] : [startDate, endDate]
  );
  return result.rows;
};

/** Doctors who have an active appointment today (CHECKED_IN or IN_PROGRESS). Optional clinicId. */
export const getDoctorsAtWorkQuery = async (clinicId = null) => {
  const hasClinic = clinicId != null;
  const result = await pool.query(
    `SELECT DISTINCT d.id, d.name, d.email
     FROM doctors d
     INNER JOIN appointments a ON a.doctor_id = d.id
     WHERE a.appointment_date = CURRENT_DATE
     AND a.status IN ('CHECKED_IN', 'IN_PROGRESS')
     ${hasClinic ? "AND a.clinic_id = $1" : ""}
     ORDER BY d.name`,
    hasClinic ? [clinicId] : []
  );
  return result.rows;
};

/** Pending approval requests (appointments with status REQUESTED). Optional clinicId. */
export const getApprovalRequestsQuery = async (clinicId = null) => {
  const hasClinic = clinicId != null;
  const result = await pool.query(
    `SELECT a.id, a.appointment_date, a.preferred_time, a.notes, a.created_at,
            u.full_name AS patient_name, c.name AS clinic_name, d.name AS doctor_name
     FROM appointments a
     JOIN users u ON u.id = a.patient_id
     LEFT JOIN clinics c ON c.id = a.clinic_id
     LEFT JOIN doctors d ON d.id = a.doctor_id
     WHERE a.status = $1
     ${hasClinic ? "AND a.clinic_id = $2" : ""}
     ORDER BY a.created_at DESC`,
    hasClinic ? [APPOINTMENT_STATUS.Requested, clinicId] : [APPOINTMENT_STATUS.Requested]
  );
  return result.rows;
};
