import pool from "../config/db.js";

export const checkDoctorEmailExistQuery = async (email) => {
  const result = await pool.query(
    `SELECT id FROM doctors 
      WHERE email=$1 AND status = TRUE`,
    [email]
  );
  return result.rows.length > 0;
};

export const findDoctorByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM doctors WHERE email = $1 AND status = TRUE`,
    [email]
  );
  return result.rows[0] || null;
};

export const createDoctorQuery = async (data) => {
  const { name, specialization, phone, email } = data;
  const result = await pool.query(
    `INSERT INTO doctors ( name, specialization, phone, email) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, specialization, phone, email]
  );

  return result.rows[0];
};

export const addDoctorClinicQuery = async (doctorId, clinicIds) => {
  if (!clinicIds || clinicIds.length === 0) {
    throw new Error("Clinic is required.");
  }

  const values = clinicIds.map((id, idx) => `($1, $${idx + 2})`).join(", ");

  const params = [doctorId, ...clinicIds];

  await pool.query(
    `INSERT INTO doctor_clinics (doctor_id, clinic_id) VALUES ${values}
      ON CONFLICT (doctor_id, clinic_id) DO NOTHING`,
    params
  );
};

export const getDoctorByClinicQuery = async (clinicId) => {
  const result = await pool.query(
    `SELECT
      d.id AS doctor_id,
      d.name AS doctor_name,
      d.specialization,
      d.phone,
      d.email,
      d.status AS doctor_status,
      
      c.id AS clinic_id,
      c.name AS clinic_name,
      dc.status AS doctor_clinic_status
    FROM doctor_clinics dc
    JOIN doctors d ON d.id = dc.doctor_id
    JOIN clinics c ON c.id = dc.clinic_id
    WHERE dc.clinic_id = $1
      AND dc.status = TRUE
      AND d.status = TRUE
      AND c.is_active = TRUE
    ORDER BY d.id ASC`,
    [clinicId]
  );

  return result.rows;
};
