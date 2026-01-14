// src/models/userModel.js
import pool from "../config/db.js";
import USER_TYPE from "../enums/userType.enum.js";

export const createUserQuery = async ({
  full_name,
  username,
  email,
  hashedPassword,
  phone,
  gender,
  role_id,
  isActive,
}) => {
  const result = await pool.query(
    `
    INSERT INTO users (full_name, username, email, password, phone, gender, role_id, user_type, isActive)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
    `,
    [
      full_name,
      username,
      email,
      hashedPassword,
      phone,
      gender,
      role_id,
      USER_TYPE.Internal,
      isActive ?? true,
    ]
  );

  return result.rows[0].id;
};

export const assignStaffToClinicQuery = async (userId, clinicId) => {
  await pool.query(
    `
    INSERT INTO clinic_staff (user_id, clinic_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    `,
    [userId, clinicId]
  );
};

export const getStaffClinicsQuery = async (userId) => {
  const result = await pool.query(
    `
    SELECT clinic_id
    FROM clinic_staff
    WHERE user_id = $1
    `,
    [userId]
  );
  return result.rows.map((r) => r.clinic_id);
};

export const deleteStaffClinicsQuery = async (userId) => {
  await pool.query(`DELETE FROM clinic_staff WHERE user_id = $1`, [userId]);
};

export const getStaffWithClinicsQuery = async () => {
  const result = await pool.query(`
    SELECT
      u.id,
      u.full_name,
      u.username,
      u.email,
      u.phone,
      u.gender,
      u.isactive,
      u.role_id,
      r.role_name,
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'id', c.id,
            'name', c.name
          )
        ) FILTER (WHERE c.id IS NOT NULL),
        '[]'
      ) AS clinics
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    LEFT JOIN clinic_staff cs ON cs.user_id = u.id
    LEFT JOIN clinics c ON c.id = cs.clinic_id
    WHERE u.user_type = 'INTERNAL'
      And u.isactive = TRUE
      AND u.role_id <> (
          SELECT id FROM roles WHERE code = 'SUPERADMIN' LIMIT 1
      )
    GROUP BY u.id, u.role_id, r.role_name
    ORDER BY u.id ASC
  `);

  return result.rows;
};

// export const getAllUsersQuery = async () => {
//   const result = await pool.query(`
//     SELECT id, full_name, email, role_id, isActive, created_at FROM users
//     ORDER BY id ASC
//   `);
//   return result.rows;
// };

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

export const getUserByIdWithClinicsQuery = async (id) => {
  const result = await pool.query(
    `
    SELECT
      u.id,
      u.full_name,
      u.username,
      u.email,
      u.phone,
      u.gender,
      u.role_id,
      u.isactive,
      u.role_id,
      r.role_name,
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'id', c.id,
            'name', c.name
          )
        ) FILTER (WHERE c.id IS NOT NULL),
        '[]'
      ) AS clinics
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    LEFT JOIN clinic_staff cs ON cs.user_id = u.id
    LEFT JOIN clinics c ON c.id = cs.clinic_id
    WHERE u.id = $1 AND u.isactive = TRUE
    GROUP BY u.id, u.role_id, r.role_name
  `,
    [id]
  );

  return result.rows[0];
};

// export const getUserByIdQuery = async (id) => {
//   const result = await pool.query(
//     `
//     SELECT id, full_name, email, role_id, isActive, created_at
//     FROM users WHERE id = $1
//     `,
//     [id]
//   );
//   return result.rows[0];
// };

export const updateUserQuery = async (
  id,
  { full_name, username, email, phone, gender, role_id }
) => {
  const result = await pool.query(
    `
    UPDATE users
    SET full_name = $1, username = $2, email = $3, phone = $4, gender = $5, role_id = $6
    WHERE id = $7
    RETURNING *
    `,
    [full_name, username, email, phone, gender, role_id, id]
  );
  return result.rows[0];
};

export const deleteUserQuery = async (id) => {
  const result = await pool.query(
    `
    UPDATE users 
    SET isactive = FALSE
    WHERE id = $1
      AND isactive = TRUE
      AND user_type = 'INTERNAL'
      RETURNING id
    `,
    [id]
  );
  return result.rows[0];
};
