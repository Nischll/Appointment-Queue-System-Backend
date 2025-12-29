// src/models/userModel.js
import pool from "../config/db.js";

export const createUserQuery = async ({ fullName, email, hashedPassword, role_id, isActive }) => {
  const result = await pool.query(
    `
    INSERT INTO users (full_name, email, password, role_id, isActive)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [fullName, email, hashedPassword, role_id, isActive ?? true]
  );

  return result.rows[0].id;
};
export const getAllUsersQuery = async () => {
  const result = await pool.query(`
    SELECT id, full_name, email, role_id, isActive, created_at FROM users
    ORDER BY id ASC
  `);
  return result.rows;
};
// userModel.js
export const getUsersByRoleQuery = async (roleName) => {
  const result = await pool.query(
    `
    SELECT u.id, u."full_name", u.email, u.role_id, r.role_name, u.isActive 
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE r.role_name = $1
    ORDER BY u.id ASC
    `,
    [roleName]
  );
  return result.rows;
};

export const getUserByIdQuery = async (id) => {
  const result = await pool.query(
    `
    SELECT id, full_name, email, role_id, isActive, created_at
    FROM users WHERE id = $1
    `,
    [id]
  );
  return result.rows[0];
};

export const updateUserQuery = async (id, { fullName, email, role_id, isActive }) => {
  const result = await pool.query(
    `
    UPDATE users
    SET full_name = $1, email = $2, role_id = $3, isActive = $4
    WHERE id = $5
    RETURNING *
    `,
    [fullName, email, role_id, isActive, id]
  );
  return result.rows[0];
};

export const deleteUserQuery = async (id) => {
  const result = await pool.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id]);
  return result.rows[0];
};
