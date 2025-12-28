import pool from "../config/db.js";

export const checkDoctorShiftOverlapQuery = async (
  client,
  doctorId,
  dayOfWeek,
  startTime,
  endTime,
  departmentId
) => {
  const result = await client.query(
    `
    SELECT 1
    FROM doctor_shifts
    WHERE doctor_id = $1
      AND day_of_week = $2
      AND department_id = $5
      AND is_day_off = FALSE
      AND id != ANY($6)
      AND (
        $3 < end_time
        AND $4 > start_time
      )
    LIMIT 1
    `,
    [doctorId, dayOfWeek, startTime, endTime, departmentId]
  );

  return result.rows.length > 0;
};

export const insertDoctorShiftsQuery = async (
  client,
  doctorId,
  departmentId,
  shifts
) => {
  for (const s of shifts) {
    await client.query(
      `
      INSERT INTO doctor_shifts
      (doctor_id, department_id, day_of_week, start_time, end_time, is_day_off)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        doctorId,
        departmentId,
        s.day_of_week,
        s.start_time ?? null,
        s.end_time ?? null,
        s.is_day_off ?? false,
      ]
    );
  }
};

export const deleteDoctorShiftsQuery = async (
  client,
  doctorId,
  departmentId
) => {
  await client.query(
    `DELETE FROM doctor_shifts
     WHERE doctor_id = $1 AND department_id = $2`,
    [doctorId, departmentId]
  );
};

export const getDoctorShiftsQuery = async (doctorId, departmentId) => {
  const result = await pool.query(
    `
      SELECT
        id,
        day_of_week,
        start_time,
        end_time,
        is_day_off
      FROM doctor_shifts
      where doctor_id = $1
        and department_id = $2
      ORDER BY day_of_week ASC
    `,
    [doctorId, departmentId]
  );

  return result.rows;
};

export const updateDoctorShiftQuery = async (client, shiftId, shift) => {
  await client.query(
    `
    UPDATE doctor_shifts
    SET start_time = $1,
        end_time = $2,
        is_day_off = $3
    WHERE id = $4
    `,
    [shift.start_time, shift.end_time, shift.is_day_off ?? false, shiftId]
  );
};

export const deleteDoctorShiftByIdQuery = async (client, shiftId) => {
  await client.query(
    `DELETE FROM doctor_shifts WHERE id = $1`,
    [shiftId]
  );
};
