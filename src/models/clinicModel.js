import pool from "../config/db.js";

export const checkClinicExistQuery = async (name) => {
  const result = await pool.query(
    `SELECT id FROM clinics WHERE name = $1 AND is_active = TRUE`,
    [name]
  );
  return result.rows.length > 0;
};

export const createClinicQuery = async (dto) => {
  const { name, address, contact } = dto;

  const result = await pool.query(
    `INSERT INTO clinics (name, address, contact) VALUES ($1, $2, $3) RETURNING *`,
    [name, address, contact]
  );

  return result.rows[0].id;
};

export const getAllClinicQuery = async () => {
  const result = await pool.query(
    `SELECT id, name, address, contact FROM clinics WHERE is_active = TRUE ORDER BY id ASC`
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
    [name, address, contact, clinicId]
  );

  return result.rows[0]?.id;
};

export const deleteClinicQuery = async (clinicId) => {
  const result = await pool.query(
    `UPDATE clinics
      SET is_active = FALSE 
      WHERE id = $1 AND is_active = TRUE
      RETURNING id`,
    [clinicId]
  );

  return result.rows[0]?.id;
};
