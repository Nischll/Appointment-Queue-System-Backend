import pool from "../config/db.js";

/**
 * Get internal user (Staff/Superadmin) by id for profile.
 * Only active INTERNAL users; excludes patients.
 */
export const getInternalUserByIdQuery = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      u.id,
      u.full_name,
      u.username,
      u.email,
      u.phone,
      u.gender
    FROM users u
    WHERE u.id = $1 AND u.isactive = TRUE
    `,
    [userId]
  );
  return result.rows[0];
};

/**
 * Update only editable profile fields (no role_id, isactive, user_type, password).
 */
export const updateInternalUserEditableFieldsQuery = async (
  client,
  userId,
  data
) => {
  const { full_name, username, email, phone, gender } = data;
  const result = await client.query(
    `
    UPDATE users
    SET
      full_name = COALESCE($1, full_name),
      username = COALESCE($2, username),
      email = COALESCE($3, email),
      phone = COALESCE($4, phone),
      gender = COALESCE($5, gender)
    WHERE id = $6 AND isactive = TRUE
    RETURNING id
    `,
    [full_name, username, email, phone, gender, userId]
  );
  return result.rows[0];
};

/**
 * Get current password hash for change-password verification.
 */
export const getInternalUserPasswordQuery = async (userId) => {
  const result = await pool.query(
    `SELECT password FROM users WHERE id = $1 AND isactive = TRUE`,
    [userId]
  );
  return result.rows[0];
};

/**
 * Update password for internal user.
 */
export const updateInternalUserPasswordQuery = async (
  client,
  userId,
  hashedPassword
) => {
  await client.query(
    `UPDATE users SET password = $1 WHERE id = $2 AND isactive = TRUE`,
    [hashedPassword, userId]
  );
};
