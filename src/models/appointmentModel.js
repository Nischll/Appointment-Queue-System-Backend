import pool from "../config/db.js";
import APPOINTMENT_STATUS from "../enums/appointmentStatus.enum.js";
import APPOINTMENT_TYPE from "../enums/appointmentType.enum.js";

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

export const getLiveAppointmentQuery = async (
  doctorId,
  clinicId,
  departmentId,
  appointmentDate,
) => {
  const values = [
    clinicId,
    departmentId,
    appointmentDate,
    APPOINTMENT_STATUS.Requested,
  ];
  let whereClause = `
    WHERE a.clinic_id = $1
      AND a.department_id = $2
      AND a.appointment_date = $3
      AND a.status <> $4
  `;

  let idx = 5;

  if (doctorId) {
    whereClause += ` AND a.doctor_id = $${idx++}`;
    values.push(doctorId);
  }

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
      a.actual_end_time,
      a.doctor_id             
    FROM appointments a
    JOIN users u ON u.id = a.patient_id
    LEFT JOIN users c ON c.id = a.created_by
    LEFT JOIN users x ON x.id = a.cancelled_by
    ${whereClause}
    ORDER BY a.doctor_id ASC, a.queue_number ASC
    `,
    values,
  );

  return result.rows;
};

export const getAppointmentHistoryQuery = async ({
  date_from,
  date_to,
  doctor_id,
  clinic_id,
  department_id,
  appointment_type,
  patient_name,
  status,
  limit,
  offset,
}) => {
  const values = [];
  let whereClause = `
    WHERE a.appointment_date BETWEEN $1 AND $2
      AND a.appointment_date < CURRENT_DATE
  `;
  values.push(date_from, date_to);

  let idx = 3;

  if (doctor_id) {
    whereClause += ` AND a.doctor_id = $${idx++}`;
    values.push(doctor_id);
  }

  if (clinic_id) {
    whereClause += ` AND a.clinic_id = $${idx++}`;
    values.push(clinic_id);
  }

  if (department_id) {
    whereClause += ` AND a.department_id = $${idx++}`;
    values.push(department_id);
  }

  if (appointment_type) {
    whereClause += ` AND a.appointment_type = $${idx++}`;
    values.push(appointment_type);
  }

  if (status) {
    whereClause += ` AND a.status = $${idx++}`;
    values.push(status);
  }

  if (patient_name) {
    whereClause += ` AND u.full_name ILIKE $${idx++}`;
    values.push(`%${patient_name}%`);
  }

  const countResult = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM appointments a
    JOIN users u ON u.id = a.patient_id
    ${whereClause}
    `,
    values,
  );

  const total = parseInt(countResult.rows[0].total, 10);

  const result = await pool.query(
    `
    SELECT
      a.id,
      a.patient_id,
      u.full_name AS patient_name,
      a.clinic_id,
      cl.name AS clinic_name,
      a.department_id,
      de.name AS department_name,
      a.doctor_id,
      d.name AS doctor_name,
      a.queue_number,
      a.status,
      a.notes,
      a.created_by,
      c.full_name AS created_by_name,
      a.cancelled_by,
      x.full_name AS cancelled_by_name,
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
    LEFT JOIN clinics cl ON cl.id = a.clinic_id
    LEFT JOIN departments de ON de.id = a.department_id
    LEFT JOIN doctors d ON d.id = a.doctor_id
    ${whereClause}
    ORDER BY a.appointment_date DESC, a.queue_number ASC
    LIMIT $${idx} OFFSET $${idx + 1}  
    `,
    [...values, limit, offset],
  );

  return {
    rows: result.rows,
    total,
  };
};

export const getNextQueueNumberQuery = async (
  client,
  doctorId,
  appointmentDate,
  clinicId,
  departmentId,
) => {
  const result = await client.query(
    `
    SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_queue
    FROM appointments
    WHERE doctor_id = $1
      AND appointment_date = $2
      AND clinic_id = $3
      AND department_id = $4
    `,
    [doctorId, appointmentDate, clinicId, departmentId],
  );

  return parseInt(result.rows[0].next_queue, 10);
};

export const updateAppointmentQuery = async (client, appointmentId, data) => {
  const {
    patient_id,
    doctor_id,
    clinic_id,
    department_id,
    appointment_type,
    scheduled_start_time,
    estimated_duration,
    notes,
    is_walk_in,
    queue_number,
  } = data;

  const fields = [];
  const values = [];
  let idx = 1;

  const add = (col, val) => {
    if (val !== undefined) {
      fields.push(`${col} = $${idx++}`);
      values.push(val);
    }
  };

  add("patient_id", patient_id);
  add("doctor_id", doctor_id);
  add("clinic_id", clinic_id);
  add("department_id", department_id);
  add("appointment_type", appointment_type);
  add("scheduled_start_time", scheduled_start_time);
  add("estimated_duration", estimated_duration);
  add("notes", notes);
  add("is_walk_in", is_walk_in);
  add("queue_number", queue_number);

  if (!fields.length) throw new Error("No fields provided to update.");

  const result = await client.query(
    `
    UPDATE appointments
    SET
      ${fields.join(", ")},
      updated_at = NOW()
    WHERE id = $${idx}  
    RETURNING *
    `,
    [...values, appointmentId],
  );

  if (!result.rows.length) {
    throw new Error("Appointment not found or not editable.");
  }

  return result.rows[0];
};

// PATIENT
export const checkDuplicatePatientRequestQuery = async (
  client,
  patientId,
  clinicId,
  preferredDate,
) => {
  const result = await client.query(
    `
    SELECT id
    FROM appointments
    WHERE patient_id = $1
      AND clinic_id = $2
      AND appointment_date = $3
      AND status IN ($4, $5, $6)
    LIMIT 1
    `,
    [
      patientId,
      clinicId,
      preferredDate,
      APPOINTMENT_STATUS.Requested,
      APPOINTMENT_STATUS.Booked,
      APPOINTMENT_STATUS.Checked_In,
    ],
  );

  return result.rows[0];
};

export const addPatientAppoinmentQuery = async (client, patientId, dto) => {
  const result = await client.query(
    `
    INSERT INTO appointments (
      patient_id,
      clinic_id,
      department_id,
      doctor_id,
      appointment_type,
      appointment_date,
      status,
      notes,
      created_by,
      preferred_time
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$1,$9)
    RETURNING id
    `,
    [
      patientId,
      dto.clinic_id,
      dto.department_id,
      dto.doctor_id,
      APPOINTMENT_TYPE.Counselling,
      dto.preferred_date,
      APPOINTMENT_STATUS.Requested,
      dto.notes,
      dto.preferred_time,
    ],
  );

  return result.rows[0];
};

export const getPatientLiveAppointmentQuery = async (
  patientId,
  // clinicId,
  // departmentId,
  appointmentDate,
) => {
  const values = [
    patientId,
    // clinicId,
    appointmentDate,
    APPOINTMENT_STATUS.Cancelled,
    APPOINTMENT_STATUS.No_Show,
  ];

  let whereClause = `
    WHERE a.patient_id = $1
      AND a.appointment_date = $2
      AND a.status NOT IN ($3, $4)
  `;

  // let idx = 5;

  // if (departmentId) {
  //   whereClause += ` AND a.department_id = $${idx++}`;
  //   values.push(departmentId);
  // }

  const result = await pool.query(
    `
    SELECT 
      a.id,
      a.patient_id,
      u.full_name AS patient_name,
      a.clinic_id,
      cl.name AS clinic_name,
      cl.address AS clinic_address,
      a.department_id,
      de.name AS department_name,
      a.doctor_id,
      d.name AS doctor_name,
      a.queue_number,
      a.status,
      a.notes,
      a.approved_by,
      c.full_name AS appointment_approved_by,
      a.cancelled_by,
      x.full_name AS appointment_cancelled_by,
      a.cancellation_reason,
      a.appointment_type,
      TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
      a.scheduled_start_time,
      a.is_walk_in,
      a.checked_in_time,
      a.actual_start_time,
      a.actual_end_time,
      a.doctor_id,
      a.clinic_id,
      a.department_id
    FROM appointments a
    JOIN users u ON u.id = a.patient_id
    LEFT JOIN users c ON c.id = a.approved_by
    LEFT JOIN users x ON x.id = a.cancelled_by
    LEFT JOIN clinics cl ON cl.id = a.clinic_id
    LEFT JOIN departments de ON de.id = a.department_id
    LEFT JOIN doctors d ON d.id = a.doctor_id
    ${whereClause}
    ORDER BY a.created_at ASC
    `,
    values,
  );

  return result.rows;
};

export const getPatientAppointmentHistoryQuery = async ({
  patient_id,
  date_from,
  date_to,
  status,
  limit,
  offset,
}) => {
  const values = [];
  let whereClause = `
    WHERE a.patient_id = $1
      AND a.appointment_date BETWEEN $2 AND $3
      AND a.appointment_date < CURRENT_DATE
  `;

  values.push(patient_id, date_from, date_to);
  let idx = 4;

  if (status) {
    whereClause += ` AND a.status = $${idx++}`;
    values.push(status);
  }

  const countResult = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM appointments a
    ${whereClause}
    `,
    values,
  );

  const total = parseInt(countResult.rows[0].total, 10);

  const result = await pool.query(
    `
    SELECT
      a.id,
      a.patient_id,
      u.full_name AS patient_name,
      a.clinic_id,
      cl.name AS clinic_name,
      a.department_id,
      de.name AS department_name,
      a.doctor_id,
      d.name AS doctor_name,
      a.queue_number,
      a.status,
      a.notes,
      a.created_by,
      c.full_name AS created_by_name,
      a.cancelled_by,
      x.full_name AS cancelled_by_name,
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
    LEFT JOIN clinics cl ON cl.id = a.clinic_id
    LEFT JOIN departments de ON de.id = a.department_id
    LEFT JOIN doctors d ON d.id = a.doctor_id
    ${whereClause}
    ORDER BY a.appointment_date DESC, a.queue_number ASC
    LIMIT $${idx} OFFSET $${idx + 1}
    `,
    [...values, limit, offset],
  );

  return {
    rows: result.rows,
    total,
  };
};
