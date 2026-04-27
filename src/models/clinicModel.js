import pool from "../config/db.js";

export const checkClinicExistQuery = async (name) => {
  const result = await pool.query(
    `SELECT id FROM clinics WHERE name = $1 AND is_active = TRUE`,
    [name],
  );
  return result.rows.length > 0;
};

export const createClinicQuery = async (dto) => {
  const { name, address, contact } = dto;

  const result = await pool.query(
    `INSERT INTO clinics (name, address, contact) VALUES ($1, $2, $3) RETURNING *`,
    [name, address, contact],
  );

  return result.rows[0].id;
};

export const getAllClinicQuery = async () => {
  const result = await pool.query(
    `SELECT id, name, address, contact FROM clinics WHERE is_active = TRUE ORDER BY id ASC`,
  );

  return result.rows;
};

export const getClinicByStaffQuery = async (userId) => {
  const result = await pool.query(
    `
      SELECT 
      cs.clinic_id AS id,
      c.name,
      c.address
      FROM clinic_staff cs
      LEFT JOIN clinics c ON c.id = cs.clinic_id
      WHERE cs.user_id = $1
      GROUP BY cs.clinic_id, c.name, c.address
    `,
    [userId],
  );

  return result.rows;
};

export const updateClinicQuery = async (clinicId, clinicData) => {
  const { name, address, contact } = clinicData;

  const result = await pool.query(
    `UPDATE clinics
      SET name = $1,
          address = $2,
          contact = $3
        WHERE id = $4 AND is_active = TRUE
        RETURNING *`,
    [name, address, contact, clinicId],
  );

  return result.rows[0]?.id;
};

export const checkClinicActiveDepartmentsQuery = async (clinicId) => {
  const result = await pool.query(
    `
    SELECT COUNT(*) AS count
    FROM departments
    WHERE clinic_id = $1
      AND status = TRUE
    `,
    [clinicId],
  );

  return { count: parseInt(result.rows[0].count, 10) };
};

export const checkClinicActiveDoctorsQuery = async (clinicId) => {
  const result = await pool.query(
    `
    SELECT COUNT(*) AS count
    FROM doctor_departments dd
    JOIN departments d ON dd.department_id = d.id
    WHERE d.clinic_id = $1
      AND dd.status = TRUE
      AND d.status = TRUE
    `,
    [clinicId],
  );

  return { count: parseInt(result.rows[0].count, 10) };
};

export const deleteClinicQuery = async (clinicId) => {
  const result = await pool.query(
    `UPDATE clinics
      SET is_active = FALSE 
      WHERE id = $1 AND is_active = TRUE
      RETURNING id`,
    [clinicId],
  );

  return result.rows[0]?.id;
};
