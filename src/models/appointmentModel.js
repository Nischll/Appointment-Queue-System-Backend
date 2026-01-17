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
    [patient_id, clinic_id, department_id, doctor_id, appointment_date]
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
    [clinic_id, department_id, doctor_id, appointment_date]
  );
  return result.rows[0].next_queue;
};

export const insertAppointmentQuery = async (
  client,
  staffId,
  data,
  queueNumber,
  estimatedDuration
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
    ]
  );

  // await client.query("COMMIT");
  return result.rows[0];
};

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
    [APPOINTMENT_STATUS.Checked_In, appointmentId]
  );

  return result.rows[0];
};

export const checkAppointmentExistsQuery = async (client, appointmentId) => {
  const result = await client.query(
    `   
    SELECT id, doctor_id, clinic_id, department_id, appointment_date, status, actual_start_time
    FROM appointments
    WHERE id = $1
    FOR UPDATE
    
    `,
    [appointmentId]
  );

  return result.rows[0];
};

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
    ]
  );

  return result.rows[0];
};

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
    ]
  );

  return result.rows[0];
};

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
    ]
  );

  return result.rows[0];
};

export const cancelAppointmentQuery = async (
  client,
  appointmentId,
  staffId,
  reason
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
    ]
  );

  return result.rows[0];
};

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
    [APPOINTMENT_STATUS.No_Show, appointmentId, APPOINTMENT_STATUS.Booked]
  );

  return result.rows[0];
};
