import pool from "../config/db.js";

export const checkClinicExistQuery = async (name) => {
  const result = await pool.query(`SELECT id FROM clinics WHERE name = $1`, [
    name,
  ]);
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
    `SELECT id, name, address, contact FROM clinics ORDER BY id ASC`
  );

  return result.rows;
};
