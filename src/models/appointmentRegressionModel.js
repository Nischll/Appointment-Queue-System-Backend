import pool from "../config/db.js";
import APPOINTMENT_STATUS from "../enums/appointmentStatus.enum.js";

export const getRegressionTrainingDataQuery = async (
  doctorId,
  clinicId,
  departmentId,
) => {
  const result = await pool.query(
    `
    SELECT
      queue_number,
      EXTRACT(EPOCH FROM (actual_end_time - actual_start_time)) / 60 AS actual_duration
    FROM appointments
    WHERE doctor_id = $1
      AND clinic_id = $2
      AND department_id = $3
      AND status = $4
      AND actual_start_time IS NOT NULL
      AND actual_end_time IS NOT NULL
    `,
    [doctorId, clinicId, departmentId, APPOINTMENT_STATUS.Completed],
  );

  return result.rows;
};
