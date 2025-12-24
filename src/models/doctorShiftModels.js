import pool from "../config/db.js";

export const deleteDoctorShiftsQuery = async (doctorId, clinicId) => {
  await pool.query(
    `DELETE FROM doctor_shifts
     WHERE doctor_id = $1 AND clinic_id = $2`,
    [doctorId, clinicId]
  );
};

export const insertDoctorShiftsQuery = async (doctorId, clinicId, shifts) => {
  const { day_of_week, start_time, end_time, is_day_off } = shifts;
  const result = pool.query(
    `
      INSERT INTO doctor_shifts
        (doctor_id, clinic_id, day_of_week, start_time, end_time, is_day_off)
        VALUES($1, $2, $3, $4, $5, $6)
    `,
    [doctorId, clinicId, day_of_week, start_time, end_time, is_day_off]
  );

  return (await result).rows[0] || null;
};
