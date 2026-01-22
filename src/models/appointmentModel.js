import pool from "../config/db.js";
import APPOINTMENT_STATUS from "../enums/appointmentStatus.enum.js";

export const checkDuplicateAppointmentQuery = async (client, data) => {
  const { patient_id, clinic_id, department_id, doctor_id, appointment_date } =
    data;

  const result = await client.query(
    `
    SELECT id
    FROM appointments
    WHERE patient_id = $1
      AND clinic_id = $2
      AND department_id = $3
      AND doctor_id = $4
      AND appointment_date = $5
      AND status NOT IN ('CANCELLED', 'NO_SHOW')
    LIMIT 1
    `,
    [patient_id, clinic_id, department_id, doctor_id, appointment_date],
  );

  return result.rows[0];
};

export const assignQueueNumberQuery = async (client, data) => {
  const { clinic_id, department_id, doctor_id, appointment_date } = data;

  // await client.query("BEGIN");

  const result = await client.query(
    `
    SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_queue
    FROM appointments
    WHERE clinic_id = $1
      AND department_id = $2
      AND doctor_id = $3
      AND appointment_date = $4
      AND status NOT IN ('CANCELLED', 'NO_SHOW')
    `,
    [clinic_id, department_id, doctor_id, appointment_date],
  );
  return result.rows[0].next_queue;
};

// ADD APPOINTMENT
export const insertAppointmentQuery = async (
  client,
  staffId,
  data,
  queueNumber,
  estimatedDuration,
) => {
  const {
    patient_id,
    clinic_id,
    department_id,
    doctor_id,
    appointment_type,
    appointment_date,
    scheduled_start_time,
    notes,
    is_walk_in,
  } = data;

  const result = await client.query(
    `
    INSERT INTO appointments(
      patient_id,
      clinic_id,
      department_id,
      doctor_id,
      appointment_type,
      appointment_date,
      scheduled_start_time,
      queue_number,
      estimated_duration,
      status,
      created_by,
      notes,
      is_walk_in
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, $12, $13)
    RETURNING *
    `,
    [
      patient_id,
      clinic_id,
      department_id,
      doctor_id,
      appointment_type,
      appointment_date,
      scheduled_start_time,
      queueNumber,
      estimatedDuration,
      APPOINTMENT_STATUS.Booked,
      staffId,
      notes || null,
      is_walk_in || false,
    ],
  );

  // await client.query("COMMIT");
  return result.rows[0];
};

// CHECK-IN APPOINTMENT
export const checkInAppointmentQuery = async (client, appointmentId) => {
  const result = await client.query(
    `
    UPDATE appointments
    SET
      checked_in_time = NOW(),
      status = $1,
      updated_at = NOW()
    WHERE id = $2
      AND status = 'BOOKED'
    RETURNING *
    `,
    [APPOINTMENT_STATUS.Checked_In, appointmentId],
  );

  return result.rows[0];
};

// CHECK APPOINTMENT EXIST?
export const checkAppointmentExistsQuery = async (client, appointmentId) => {
  const result = await client.query(
    `   
    SELECT id, doctor_id, clinic_id, department_id, appointment_date, status, actual_start_time
    FROM appointments
    WHERE id = $1
    FOR UPDATE
    
    `,
    [appointmentId],
  );

  return result.rows[0];
};

// CHECK DOCTOR IN-PROGRESS?
export const checkDoctorInProgressQuery = async (client, data) => {
  const { doctor_id, clinic_id, department_id, appointment_date } = data;

  const result = await client.query(
    `
    SELECT id
    FROM appointments
    WHERE doctor_id = $1
      AND clinic_id = $2
      AND department_id = $3
      AND appointment_date = $4
      AND status =$5
    LIMIT 1
    `,
    [
      doctor_id,
      clinic_id,
      department_id,
      appointment_date,
      APPOINTMENT_STATUS.In_progress,
    ],
  );

  return result.rows[0];
};

// START APPOINTMENT
export const startAppointmentQuery = async (client, appointmentId) => {
  const result = await client.query(
    `
    UPDATE appointments
    SET
      actual_start_time = NOW(),
      status = $1,
      updated_at = NOW()
    WHERE id = $2
      AND status = $3
    RETURNING *
    `,
    [
      APPOINTMENT_STATUS.In_progress,
      appointmentId,
      APPOINTMENT_STATUS.Checked_In,
    ],
  );

  return result.rows[0];
};

// COMPLETE APPOINTMENT
export const completeAppointmentQuery = async (client, appointmentId) => {
  const result = await client.query(
    `
    UPDATE appointments
    SET 
      actual_end_time = NOW(),
      status = $1,
      updated_at = NOW()
    WHERE id = $2
      AND status = $3
    RETURNING *
    `,
    [
      APPOINTMENT_STATUS.Completed,
      appointmentId,
      APPOINTMENT_STATUS.In_progress,
    ],
  );

  return result.rows[0];
};

// CANCEL APPOINTMENT
export const cancelAppointmentQuery = async (
  client,
  appointmentId,
  staffId,
  reason,
) => {
  const result = await client.query(
    `
    UPDATE appointments
    SET 
      status = $1,
      cancellation_reason =  $2,
      cancelled_by = $3,
      updated_at = NOW()
    WHERE id = $4
      AND status = ANY($5)
    RETURNING *
    `,
    [
      APPOINTMENT_STATUS.Cancelled,
      reason || "Cancelled By Staff",
      staffId,
      appointmentId,
      [APPOINTMENT_STATUS.Booked, APPOINTMENT_STATUS.Checked_In],
    ],
  );

  return result.rows[0];
};

// NO-SHOW APPOINTMENT
export const noShowAppointmentQuery = async (client, appointmentId) => {
  const result = await client.query(
    `
    UPDATE appointments
    SET
      status = $1,
      updated_at = NOW()
    WHERE id = $2
      AND status = $3
    RETURNING *
    `,
    [APPOINTMENT_STATUS.No_Show, appointmentId, APPOINTMENT_STATUS.Booked],
  );

  return result.rows[0];
};

export const getAppointmentQuery = async (
  doctorId,
  clinicId,
  departmentId,
  appointmentDate,
) => {
  const result = await pool.query(
    `
    SELECT 
      a.id,
      a.patient_id,
      u.full_name AS patient_name,
      a.queue_number,
      a.status,
      a.notes,
      a.created_by,
      c.full_name AS appointment_created_by,
      a.cancelled_by,
      x.full_name AS appointment_cancelled_by,
      a.cancellation_reason,
      a.appointment_type,
      TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
      a.scheduled_start_time,
      a.is_walk_in,
      a.checked_in_time,
      a.actual_start_time,
      a.actual_end_time
    FROM appointments a
    JOIN users u ON u.id = a.patient_id
    LEFT JOIN users c ON c.id = a.created_by
    LEFT JOIN users x ON x.id = a.cancelled_by
    WHERE a.doctor_id = $1
      AND a.clinic_id = $2
      AND a.department_id = $3
      AND a.appointment_date = $4
    ORDER BY a.queue_number ASC
    `,
    [doctorId, clinicId, departmentId, appointmentDate],
  );

  return result.rows;
};
