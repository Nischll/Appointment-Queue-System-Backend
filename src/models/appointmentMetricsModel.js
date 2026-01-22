import pool from "../config/db.js";
import APPOINTMENT_STATUS from "../enums/appointmentStatus.enum.js";

export const getAppointmentMetricsQuery = async (
  doctorId,
  clinicId,
  departmentId,
  appointmentType
) => {
  const result = await pool.query(
    `
    SELECT 
      COUNT(*) AS total_appointments,
      AVG(
        EXTRACT(
          EPOCH FROM (
            actual_end_time - actual_start_time
          )
        ) / 60
      ) AS avg_duration_minutes,
      AVG(
        EXTRACT(
          EPOCH FROM (
            actual_start_time -
            (appointment_date + scheduled_start_time)
          )
        ) / 60
      ) AS avg_delay_minutes,
      SUM(CASE WHEN status = 'NO_SHOW' THEN 1 ELSE 0 END):: FLOAT / COUNT(*) AS no_show_rate
    FROM appointments
    WHERE doctor_id = $1
      AND clinic_id = $2
      AND department_id = $3
      AND appointment_type = $4
      AND status = $5
      AND actual_start_time IS NOT NULL
      AND actual_end_time IS NOT NULL
      AND actual_end_time > actual_start_time
    `,
    [
      doctorId,
      clinicId,
      departmentId,
      appointmentType,
      APPOINTMENT_STATUS.Completed,
    ]
  );

  return result.rows[0];
};
