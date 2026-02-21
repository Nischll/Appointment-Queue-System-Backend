import pool from "../config/db.js";

/**
 * Get combined profile (users + patient_profiles) for a patient by user id.
 * Used for authenticated patient's own profile only.
 */
export const getPatientProfileByUserIdQuery = async (userId) => {
  const result = await pool.query(
    `
    SELECT 
      u.id,
      u.full_name,
      u.email,
      u.username,
      u.phone,
      u.gender,
      u.user_type,
      u.isactive,
      u.created_at,
      pf.user_id AS profile_user_id,
      pf.date_of_birth::text AS date_of_birth,
      pf.age,
      pf.address,
      pf.blood_group,
      pf.emergency_contact_name,
      pf.emergency_contact_phone,
      pf.created_at AS profile_created_at,
      pf.updated_at AS profile_updated_at
    FROM users u
    LEFT JOIN patient_profiles pf ON pf.user_id = u.id
    WHERE u.id = $1 AND u.user_type = 'EXTERNAL' AND u.isactive = TRUE
    `,
    [userId]
  );
  return result.rows[0];
};

/**
 * Check if a patient_profiles row exists for the user (for upsert logic).
 */
export const getPatientProfileRowQuery = async (userId) => {
  const result = await pool.query(
    `SELECT user_id FROM patient_profiles WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
};

/**
 * Insert a new patient_profiles row. Caller must ensure at least date_of_birth or age.
 */
export const insertPatientProfileQuery = async (client, userId, data) => {
  const {
    date_of_birth,
    age,
    address,
    blood_group,
    emergency_contact_name,
    emergency_contact_phone,
  } = data;

  await client.query(
    `
    INSERT INTO patient_profiles
      (user_id, date_of_birth, age, address, blood_group,
       emergency_contact_name, emergency_contact_phone)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      userId,
      date_of_birth || null,
      age ?? null,
      address || null,
      blood_group || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
    ]
  );
};

/**
 * Update only editable user fields (no role_id, user_type, isactive, password).
 */
export const updateUserEditableFieldsQuery = async (client, userId, data) => {
  const { full_name, username, email, phone, gender } = data;
  const result = await client.query(
    `
    UPDATE users
    SET full_name = COALESCE($1, full_name),
        username = COALESCE($2, username),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        gender = COALESCE($5, gender)
    WHERE id = $6 AND user_type = 'EXTERNAL' AND isactive = TRUE
    RETURNING id
    `,
    [full_name, username, email, phone, gender, userId]
  );
  return result.rows[0];
};

/**
 * Update patient_profiles fields. Uses COALESCE to allow partial updates.
 */
export const updatePatientProfileFieldsQuery = async (client, userId, data) => {
  const {
    date_of_birth,
    age,
    address,
    blood_group,
    emergency_contact_name,
    emergency_contact_phone,
  } = data;

  const result = await client.query(
    `
    UPDATE patient_profiles
    SET
      date_of_birth = COALESCE($1, date_of_birth),
      age = COALESCE($2, age),
      address = COALESCE($3, address),
      blood_group = COALESCE($4, blood_group),
      emergency_contact_name = COALESCE($5, emergency_contact_name),
      emergency_contact_phone = COALESCE($6, emergency_contact_phone),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $7
    RETURNING user_id
    `,
    [
      date_of_birth ?? null,
      age ?? null,
      address ?? null,
      blood_group ?? null,
      emergency_contact_name ?? null,
      emergency_contact_phone ?? null,
      userId,
    ]
  );
  return result.rows[0];
};

/**
 * Get current password hash for the user (for change-password verification).
 */
export const getUserPasswordQuery = async (userId) => {
  const result = await pool.query(
    `SELECT password FROM users WHERE id = $1 AND user_type = 'EXTERNAL' AND isactive = TRUE`,
    [userId]
  );
  return result.rows[0];
};

/**
 * Update user password by id.
 */
export const updateUserPasswordQuery = async (client, userId, hashedPassword) => {
  await client.query(
    `UPDATE users SET password = $1 WHERE id = $2 AND user_type = 'EXTERNAL' AND isactive = TRUE`,
    [hashedPassword, userId]
  );
};
