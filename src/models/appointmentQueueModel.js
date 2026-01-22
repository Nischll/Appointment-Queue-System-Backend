import pool from "../config/db.js";
import APPOINTMENT_STATUS from "../enums/appointmentStatus.enum.js";

export const getAppointmentQueueQuery = async (
  doctorId,
  clinicId,
  departmentId,
  appointmentType,
  appointmentDate,
) => {
  const result = await pool.query(
    `
    SELECT 
      id,
      patient_id,
      queue_number,
      appointment_type,
      estimated_duration,
      status,
      scheduled_start_time,
      actual_start_time,
      actual_end_time
    FROM appointments
    WHERE doctor_id = $1
      AND clinic_id = $2
      AND department_id = $3
      AND appointment_type = $4
      AND appointment_date = $5
      AND status IN ($6, $7, $8)
    ORDER BY queue_number ASC
    `,
    [
      doctorId,
      clinicId,
      departmentId,
      appointmentType,
      appointmentDate,
      APPOINTMENT_STATUS.Booked,
      APPOINTMENT_STATUS.Checked_In,
      APPOINTMENT_STATUS.In_progress,
    ],
  );
  return result.rows;
};
