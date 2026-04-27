import pool from "../config/db.js";
import APPOINTMENT_STATUS from "../enums/appointmentStatus.enum.js";
import APPOINTMENT_TYPE from "../enums/appointmentType.enum.js";

// export const checkDuplicateAppointmentQuery = async (client, data) => {
//   const { patient_id, clinic_id, department_id, doctor_id, appointment_date } =
//     data;

//   const result = await client.query(
//     `
//     SELECT id
//     FROM appointments
//     WHERE patient_id = $1
//       AND clinic_id = $2
//       AND department_id = $3
//       AND doctor_id = $4
//       AND appointment_date = $5
//       AND status NOT IN ('CANCELLED', 'NO_SHOW')
//     LIMIT 1
//     `,
//     [patient_id, clinic_id, department_id, doctor_id, appointment_date],
//   );

//   return result.rows[0];
// };

export const checkDuplicateAppointmentQuery = async (client, data) => {
  const { patient_id, appointment_date } = data;

  const result = await client.query(
    `
    SELECT 
      a.id,
      d.name AS doctor_name,
      dep.name AS department_name,
      c.name AS clinic_name
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    JOIN departments dep ON a.department_id = dep.id
    JOIN clinics c ON a.clinic_id = c.id
    WHERE a.patient_id = $1
      AND a.appointment_date = $2
      AND a.status NOT IN ('CANCELLED', 'NO_SHOW', 'REJECTED')
    LIMIT 1
    `,
    [patient_id, appointment_date],
  );

  return result.rows[0];
};

export const checkDoctorAvailability = async (
  client,
  {
    doctor_id,
    clinic_id,
    department_id,
    appointment_date,
    scheduled_start_time,
    estimated_duration,
    exclude_appointment_id,
  },
) => {
  //Check doctor shift
  const shiftResult = await client.query(
    `
    SELECT 1
    FROM doctor_shifts
    WHERE doctor_id = $1
      AND department_id = $2
      AND clinic_id = $3
      AND day_of_week = EXTRACT(DOW FROM $4::date)
      AND is_day_off = false
      AND $5::time >= start_time
      AND ($5::time + ($6 || ' minutes')::interval) <= end_time
    LIMIT 1
    `,
    [
      doctor_id,
      department_id,
      clinic_id,
      appointment_date,
      scheduled_start_time,
      estimated_duration,
    ],
  );

  if (shiftResult.rowCount === 0) {
    throw new Error("Doctor is not available during the selected time");
  }

  // Block only same start time: no other appointment for this doctor on this date at this exact time
  const hasExclude = exclude_appointment_id != null;
  const sameTimeResult = await client.query(
    `
    SELECT 1
    FROM appointments
    WHERE doctor_id = $1
      AND appointment_date = $2
      AND scheduled_start_time = $3
      AND status IN ($4, $5, $6)
      ${hasExclude ? "AND id <> $7" : ""}
    LIMIT 1
    `,
    hasExclude
      ? [
          doctor_id,
          appointment_date,
          scheduled_start_time,
          APPOINTMENT_STATUS.Booked,
          APPOINTMENT_STATUS.In_progress,
          APPOINTMENT_STATUS.Checked_In,
          exclude_appointment_id,
        ]
      : [
          doctor_id,
          appointment_date,
          scheduled_start_time,
          APPOINTMENT_STATUS.Booked,
          APPOINTMENT_STATUS.In_progress,
          APPOINTMENT_STATUS.Checked_In,
        ],
  );

  if (sameTimeResult.rowCount > 0) {
    throw new Error("Doctor already has an appointment at this time");
  }

  return true;
};

export const assignQueueNumberQuery = async (client, data) => {
  const { clinic_id, department_id, doctor_id, appointment_date } = data;

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

/**
 * Renumber queue for a given doctor/clinic/department/date so that
 * queue_number reflects order by scheduled_start_time (earliest = 1).
 * Only affects appointments that are not CANCELLED or NO_SHOW.
 */
export const renumberQueueByScheduledTimeQuery = async (
  client,
  doctorId,
  clinicId,
  departmentId,
  appointmentDate,
) => {
  await client.query(
    `
    WITH ordered AS (
      SELECT id,
        ROW_NUMBER() OVER (ORDER BY scheduled_start_time ASC, id ASC) AS rn
      FROM appointments
      WHERE doctor_id = $1
        AND clinic_id = $2
        AND department_id = $3
        AND appointment_date = $4
        AND status NOT IN ('CANCELLED', 'NO_SHOW')
    )
    UPDATE appointments a
    SET queue_number = ordered.rn
    FROM ordered
    WHERE a.id = ordered.id
    `,
    [doctorId, clinicId, departmentId, appointmentDate],
  );
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
    SELECT id, doctor_id, clinic_id, department_id, appointment_date, status, actual_start_time, patient_id, appointment_type
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
      u.phone AS patient_phone,
      a.queue_number,
      a.status,
      a.notes,
      a.created_by,
      c.full_name AS appointment_created_by,
      a.approved_by,
      ap.full_name AS appointment_approved_by,
      a.cancelled_by,
      x.full_name AS appointment_cancelled_by,
      a.rescheduled_by,
      rs.full_name AS appointment_rescheduled_by,
      a.cancellation_reason,
      a.appointment_type,
      TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
      a.scheduled_start_time,
      a.is_walk_in,
      a.checked_in_time,
      a.actual_start_time,
      a.actual_end_time,
      a.doctor_id,
      d.name AS doctor_name,
      a.clinic_id,
      cl.name AS clinic_name,
      a.department_id,
      de.name AS department_name,
      a.cancellation_reason
      
    FROM appointments a
    JOIN users u ON u.id = a.patient_id
    LEFT JOIN users c ON c.id = a.created_by
    LEFT JOIN users x ON x.id = a.cancelled_by
    LEFT JOIN users rs ON rs.id = a.rescheduled_by
    LEFT JOIN users ap ON ap.id = a.approved_by
    LEFT JOIN doctors d ON d.id = a.doctor_id
    LEFT JOIN clinics cl ON cl.id = a.clinic_id
    LEFT JOIN departments de ON de.id = a.department_id
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
      u.phone AS patient_phone,
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
      c.full_name AS appointment_created_by,
      a.approved_by,
      ap.full_name AS appointment_approved_by,
      a.cancelled_by,
      x.full_name AS appointment_cancelled_by,
      a.rescheduled_by,
      rs.full_name AS appointment_rescheduled_by,
      a.cancellation_reason,
      a.appointment_type,
      TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
      a.preferred_time,
      a.scheduled_start_time,
      a.is_walk_in,
      a.checked_in_time,
      a.actual_start_time,
      a.actual_end_time
    FROM appointments a
    JOIN users u ON u.id = a.patient_id
    LEFT JOIN users c ON c.id = a.created_by
    LEFT JOIN users x ON x.id = a.cancelled_by
    LEFT JOIN users rs ON rs.id = a.rescheduled_by
    LEFT JOIN users ap ON ap.id = a.approved_by
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

/**
 * Get appointment details with patient email for sending notifications.
 * Returns null if appointment not found. Use after transaction commit.
 */
export const getAppointmentDetailsForNotification = async (appointmentId) => {
  const result = await pool.query(
    `
    SELECT
      a.id,
      a.patient_id,
      u.full_name AS patient_name,
      u.email AS patient_email,
      a.appointment_type,
      TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
      a.scheduled_start_time,
      a.preferred_time,
      a.queue_number,
      a.status,
      a.cancellation_reason,
      a.notes,
      cl.name AS clinic_name,
      de.name AS department_name,
      d.name AS doctor_name
    FROM appointments a
    JOIN users u ON u.id = a.patient_id
    LEFT JOIN clinics cl ON cl.id = a.clinic_id
    LEFT JOIN departments de ON de.id = a.department_id
    LEFT JOIN doctors d ON d.id = a.doctor_id
    WHERE a.id = $1
    `,
    [appointmentId],
  );
  return result.rows[0] || null;
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

export const getUpcomingAppointmentsQuery = async ({
  date_from,
  date_to,
  limit,
  offset,
  status,
  clinic_id,
  department_id,
  doctor_id,
  appointment_type,
  patient_name,
}) => {
  const values = [status];
  let whereClause = `
    WHERE a.status = $1
  `;
  let idx = 2;

  if (date_from && date_to) {
    whereClause += ` AND a.appointment_date BETWEEN $${idx++} AND $${idx++}`;
    values.push(date_from, date_to);
  }

  if (clinic_id) {
    whereClause += ` AND a.clinic_id = $${idx++}`;
    values.push(clinic_id);
  }

  if (department_id) {
    whereClause += ` AND a.department_id = $${idx++}`;
    values.push(department_id);
  }

  if (doctor_id) {
    whereClause += ` AND a.doctor_id = $${idx++}`;
    values.push(doctor_id);
  }

  if (appointment_type) {
    whereClause += ` AND a.appointment_type = $${idx++}`;
    values.push(appointment_type);
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
      u.phone AS patient_phone,
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
      c.full_name AS appointment_created_by,
      a.approved_by,
      ap.full_name AS appointment_approved_by,
      a.cancelled_by,
      x.full_name AS appointment_cancelled_by,
      a.rescheduled_by,
      rs.full_name AS appointment_rescheduled_by,
      a.cancellation_reason,
      a.appointment_type,
      TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
      a.preferred_time,
      a.scheduled_start_time,
      a.is_walk_in,
      a.checked_in_time,
      a.actual_start_time,
      a.actual_end_time
    FROM appointments a
    JOIN users u ON u.id = a.patient_id
    LEFT JOIN users c ON c.id = a.created_by
    LEFT JOIN users x ON x.id = a.cancelled_by
    LEFT JOIN users rs ON rs.id = a.rescheduled_by
    LEFT JOIN users ap ON ap.id = a.approved_by
    LEFT JOIN clinics cl ON cl.id = a.clinic_id
    LEFT JOIN departments de ON de.id = a.department_id
    LEFT JOIN doctors d ON d.id = a.doctor_id
    ${whereClause}
    ORDER BY a.created_at ASC
    LIMIT $${idx} OFFSET $${idx + 1}
    `,
    [...values, limit, offset],
  );

  return { rows: result.rows, total };
};

export const approveAppointmentQuery = async (client, appointmentId, data) => {
  const {
    doctor_id,
    clinic_id,
    department_id,
    appointment_date,
    scheduled_start_time,
    notes,
    queue_number,
    approved_by,
    status,
    estimated_duration,
    appointment_type,
  } = data;

  const result = await client.query(
    `
    UPDATE appointments
    SET
      doctor_id = $1,
      clinic_id = $2,
      department_id = $3,
      appointment_date = COALESCE($4::date, appointment_date),
      scheduled_start_time = $5,
      notes = $6,
      queue_number = $7,
      status = $8,
      approved_by = $9,
      estimated_duration = $10,
      appointment_type = $11,
      updated_at = NOW()
    WHERE id = $12
    RETURNING *
    `,
    [
      doctor_id,
      clinic_id,
      department_id,
      appointment_date ?? null,
      scheduled_start_time,
      notes,
      queue_number,
      status,
      approved_by,
      estimated_duration,
      appointment_type,
      appointmentId,
    ],
  );

  if (!result.rows.length) {
    throw new Error("Failed to approve appointment.");
  }

  return result.rows[0];
};

export const rejectAppointmentQuery = async (client, appointmentId, data) => {
  const { status, cancelled_by, cancellation_reason } = data;

  const result = await client.query(
    `
    UPDATE appointments
    SET
      status = $1,
      cancelled_by = $2,
      cancellation_reason = $3,
      updated_at = NOW()
    WHERE id = $4
    RETURNING *
    `,
    [status, cancelled_by, cancellation_reason, appointmentId],
  );

  if (!result.rows.length) {
    throw new Error("Failed to reject appointment.");
  }

  return result.rows[0];
};

export const insertFollowUpAppointmentQuery = async (
  client,
  previousAppointment,
  data,
  staffId,
  queueNumber,
  estimatedDuration,
) => {
  const result = await client.query(
    `
    INSERT INTO appointments (
      patient_id,
      doctor_id,
      clinic_id,
      department_id,
      appointment_type,
      appointment_date,
      scheduled_start_time,
      estimated_duration,
      status,
      created_by,
      notes,
      previous_appointment_id,
      queue_number,
      is_walk_in
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
    )
    RETURNING id
    `,
    [
      previousAppointment.patient_id,
      data.doctor_id,
      previousAppointment.clinic_id,
      previousAppointment.department_id,
      data.appointment_type,
      data.appointment_date,
      data.scheduled_start_time,
      estimatedDuration,
      APPOINTMENT_STATUS.Booked,
      staffId,
      data.notes,
      previousAppointment.id,
      queueNumber,
      false,
    ],
  );

  return result.rows[0];
};

export const rescheduleAppointmentQuery = async (
  client,
  appointmentId,
  staffId,
  data,
) => {
  const result = await client.query(
    `
    UPDATE appointments
    SET
      appointment_date = $1,
      scheduled_start_time = $2,
      doctor_id = $3,
      clinic_id = $4,
      department_id = $5,
      notes = COALESCE($6, notes),
      rescheduled_by = $7,
      updated_at = NOW()
    WHERE id = $8
    RETURNING *
    `,
    [
      data.appointment_date,
      data.scheduled_start_time,
      data.doctor_id,
      data.clinic_id,
      data.department_id,
      data.notes,
      staffId,
      appointmentId,
    ],
  );

  return result.rows[0];
};

// PATIENT
export const checkDuplicatePatientRequestQuery = async (
  client,
  patientId,
  preferredDate,
) => {
  const result = await client.query(
    `
    SELECT 
      a.id,
      c.name AS clinic_name
    FROM appointments a
    JOIN clinics c ON a.clinic_id = c.id
    WHERE a.patient_id = $1
      AND a.appointment_date = $2
      AND a.status NOT IN ('CANCELLED', 'NO_SHOW', 'REJECTED')
    LIMIT 1
    `,
    [patientId, preferredDate],
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
      u.phone AS patient_phone,
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
      a.rescheduled_by,
      rs.full_name AS appointment_rescheduled_by,
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
    LEFT JOIN users rs ON rs.id = a.rescheduled_by
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
      u.phone AS patient_phone,
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
      a.rescheduled_by,
      rs.full_name AS appointment_rescheduled_by,
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
    LEFT JOIN users rs ON rs.id = a.rescheduled_by
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

export const getPatientPendingAppointmentsQuery = async ({
  patient_id,
  status,
}) => {
  const onlyFuture = status !== APPOINTMENT_STATUS.Rejected;
  const result = await pool.query(
    `
    SELECT
      a.id,
      a.patient_id,
      u.full_name AS patient_name,
      u.phone AS patient_phone,
      a.clinic_id,
      cl.name AS clinic_name,
      a.department_id,
      de.name AS department_name,
      a.doctor_id,
      d.name AS doctor_name,
      a.status,
      a.notes,
      a.appointment_type,
      TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
      a.preferred_time,
      a.scheduled_start_time,
      a.is_walk_in,
      a.created_at,
      a.rescheduled_by,
      a.cancellation_reason,
      rs.full_name AS appointment_rescheduled_by
    FROM appointments a
    JOIN users u ON u.id = a.patient_id
    LEFT JOIN users rs ON rs.id = a.rescheduled_by
    LEFT JOIN clinics cl ON cl.id = a.clinic_id
    LEFT JOIN departments de ON de.id = a.department_id
    LEFT JOIN doctors d ON d.id = a.doctor_id
    WHERE a.patient_id = $1
      AND a.status = $2
      ${onlyFuture ? "AND a.appointment_date >= CURRENT_DATE" : ""}
    ORDER BY a.appointment_date ASC, a.created_at ASC
    `,
    [patient_id, status],
  );

  return { rows: result.rows };
};

/** List appointments for a doctor on a given date (for booking/update UI to show occupied slots). Optional clinicId. */
export const getDoctorAppointmentsByDateQuery = async (
  doctorId,
  date,
  clinicId = null,
) => {
  const hasClinic = clinicId != null;
  const result = await pool.query(
    `
    SELECT a.id, a.scheduled_start_time, a.estimated_duration, a.appointment_type,
           a.status, u.full_name AS patient_name
    FROM appointments a
    JOIN users u ON u.id = a.patient_id
    WHERE a.doctor_id = $1
      AND a.appointment_date = $2
      AND a.status NOT IN ('CANCELLED', 'REJECTED', 'NO_SHOW')
      ${hasClinic ? "AND a.clinic_id = $3" : ""}
    ORDER BY a.scheduled_start_time ASC
    `,
    hasClinic ? [doctorId, date, clinicId] : [doctorId, date],
  );
  return result.rows;
};
