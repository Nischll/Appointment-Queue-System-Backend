import pool from "../config/db.js";

export const checkDoctorShiftOverlapQuery = async (
  client,
  doctorId,
  dayOfWeek,
  startTime,
  endTime,
  currentShiftId = null
) => {
  const result = await client.query(
    `
    SELECT 1
    FROM doctor_shifts
    WHERE doctor_id = $1
      AND day_of_week = $2
      AND is_day_off = FALSE
      AND ($5::int IS NULL OR id <> $5)
      AND (
        $3 < end_time
        AND $4 > start_time
      )
    LIMIT 1
    `,
    [doctorId, dayOfWeek, startTime, endTime, currentShiftId]
  );

  return result.rows.length > 0;
};

export const insertDoctorShiftsQuery = async (
  client,
  doctorId,
  departmentId,
  clinicId,
  shifts
) => {
  for (const s of shifts) {
    await client.query(
      `
      INSERT INTO doctor_shifts
      (doctor_id, department_id, clinic_id, day_of_week, start_time, end_time, is_day_off)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        doctorId,
        departmentId,
        clinicId,
        s.day_of_week,
        s.start_time,
        s.end_time,
        s.is_day_off ?? false,
      ]
    );
  }
};

export const getDoctorShiftsQuery = async (
  doctorId,
  departmentId,
  clinicId
) => {
  const result = await pool.query(
    `
    SELECT
      id,
      day_of_week,
      start_time,
      end_time,
      is_day_off
    FROM doctor_shifts
    WHERE doctor_id = $1
      AND department_id = $2
      AND clinic_id = $3
    ORDER BY day_of_week, start_time
    `,
    [doctorId, departmentId, clinicId]
  );

  return result.rows;
};

export const updateDoctorShiftQuery = async (client, shiftId, shift) => {
  await client.query(
    `
    UPDATE doctor_shifts
    SET day_of_week = $1,
        start_time = $2,
        end_time = $3,
        is_day_off = $4
    WHERE id = $5
    `,
    [
      shift.day_of_week,
      shift.start_time,
      shift.end_time,
      shift.is_day_off ?? false,
      shiftId,
    ]
  );
};

export const deleteDoctorShiftByIdQuery = async (client, shiftId) => {
  await client.query(`DELETE FROM doctor_shifts WHERE id = $1`, [shiftId]);
};
