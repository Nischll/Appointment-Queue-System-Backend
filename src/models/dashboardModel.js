import pool from "../config/db.js";
import APPOINTMENT_STATUS from "../enums/appointmentStatus.enum.js";

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
