import pool from "../config/db.js";

export const createRoleQuery = async (roleData) => {
  const { role_name, code, description } = roleData;

  const result = await pool.query(
    `INSERT INTO roles (role_name, code, description) 
     VALUES ($1, $2, $3) RETURNING *`,
    [role_name, code, description]
  );

  return result.rows[0];
};
