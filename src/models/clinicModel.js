import pool from "../config/db.js";

export const createClinicQuery = async (dto) => {
  const { name, address, contact } = dto;

  const result = await pool.query(
    `INSERT INTO clinics (name, address, contact) VALUES ($1, $2, $3) RETURNING *`,
    [name, address, contact]
  );

  return result.rows[0].id;
};
