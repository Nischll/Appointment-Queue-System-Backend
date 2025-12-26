import pool from "../config/db.js";

export const checkDoctorShiftOverlapQuery = async (
  client,
  doctorId,
  dayOfWeek,
  startTime,
  endTime,
  clinicId
) => {
  const result = await client.query(
    `
    SELECT 1
    FROM doctor_shifts
    WHERE doctor_id = $1
      AND day_of_week = $2
      AND clinic_id <> $5
      AND is_day_off = FALSE
      AND (
        $3 < end_time
        AND $4 > start_time
      )
    LIMIT 1
    `,
    [doctorId, dayOfWeek, startTime, endTime, clinicId]
  );

  return result.rows.length > 0;
};

export const insertDoctorShiftsQuery = async (
  client,
  doctorId,
  clinicId,
  shifts
) => {
  for (const s of shifts) {
    await client.query(
      `
      INSERT INTO doctor_shifts
      (doctor_id, clinic_id, day_of_week, start_time, end_time, is_day_off)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        doctorId,
        clinicId,
        s.day_of_week,
        s.start_time ?? null,
        s.end_time ?? null,
        s.is_day_off ?? false,
      ]
    );
  }
};

export const deleteDoctorShiftsQuery = async (client, doctorId, clinicId) => {
  await client.query(
    `DELETE FROM doctor_shifts
     WHERE doctor_id = $1 AND clinic_id = $2`,
    [doctorId, clinicId]
  );
};

export const getDoctorShiftsQuery = async (doctorId, clinicId) => {
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
        and clinic_id = $2
      ORDER BY day_of_week ASC
    `,
    [doctorId, clinicId]
  );

  return result.rows;
};
