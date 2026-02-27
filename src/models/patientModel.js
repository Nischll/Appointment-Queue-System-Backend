import pool from "../config/db.js";


const patientListSelect = `
  SELECT 
    u.id,
    u.full_name, 
    u.email,
    u.username,
    u.phone,
    u.gender,
    pf.date_of_birth::text AS dob,
    pf.age,
    pf.address,
    pf.blood_group,
    pf.emergency_contact_name,
    pf.emergency_contact_phone
  FROM users u
  LEFT JOIN patient_profiles pf ON pf.user_id = u.id
  WHERE u.user_type = 'EXTERNAL' AND u.isactive = TRUE
`;
const patientListOrder = `ORDER BY u.id ASC`;

export const getAllPatientQuery = async () => {
  const result = await pool.query(
    `${patientListSelect} ${patientListOrder}`
  );
  return result.rows;
};

export const getPatientsPaginatedQuery = async ({ limit, offset, search }) => {
  const baseWhere = `WHERE u.user_type = 'EXTERNAL' AND u.isactive = TRUE`;
  const searchWhere = search && search.trim()
    ? ` AND u.full_name ILIKE $1`
    : "";
  const countParams = search && search.trim() ? [`%${search.trim()}%`] : [];
  const countResult = await pool.query(
    `SELECT COUNT(*) AS total FROM users u
     LEFT JOIN patient_profiles pf ON pf.user_id = u.id
     ${baseWhere}${searchWhere}`,
    countParams
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const selectParams = search && search.trim()
    ? [`%${search.trim()}%`, limit, offset]
    : [limit, offset];
  const selectWhere = search && search.trim()
    ? ` AND u.full_name ILIKE $1`
    : "";
  const limitOffsetPlaceholders = search && search.trim()
    ? `LIMIT $2 OFFSET $3`
    : `LIMIT $1 OFFSET $2`;

  const result = await pool.query(
    `${patientListSelect}${selectWhere} ${patientListOrder}
     ${limitOffsetPlaceholders}`,
    selectParams
  );

  return { rows: result.rows, total };
};


export const getPatientByIdQuery = async (patientId) => {
  const result = await pool.query(
    `
     SELECT 
      u.id,
      u.full_name, 
      u.email,
      u.username,
      u.phone,
      u.gender,
      pf.date_of_birth::text AS dob,
      pf.age,
      pf.address,
      pf.blood_group,
      pf.emergency_contact_name,
      pf.emergency_contact_phone
    FROM users u
    LEFT JOIN patient_profiles pf ON pf.user_id = u.id
    WHERE u.id = $1 AND u.user_type = 'EXTERNAL' AND u.isactive = TRUE
    `,
    [patientId]
  );

  return result.rows[0];
};

export const deletePatientQuery = async (patientId) => {
  const result = pool.query(
    `
    UPDATE users
      SET isactive = FALSE
      WHERE id = $1
        AND isactive = TRUE
        AND user_type = 'EXTERNAL'
        RETURNING id
    `,
    [patientId]
  );
  return (await result).rows[0];
};

export const updatePatientQuery = async (client, patientId, data) => {
  const {
    full_name,
    username,
    email,
    phone,
    gender,
    date_of_birth,
    age,
    address,
    blood_group,
    emergency_contact_name,
    emergency_contact_phone,
  } = data;

  await client.query(
    `
    UPDATE users
    SET
      full_name = $1,
      username = $2,
      email = $3,
      phone = $4,
      gender = $5
    WHERE id = $6 
      AND user_type = 'EXTERNAL' 
      AND isactive = TRUE
    RETURNING id
    `,
    [full_name, username, email, phone, gender, patientId]
  );

  const profileUpdate = await client.query(
    `
    UPDATE patient_profiles
    SET
      date_of_birth = $1,
      age = $2,
      address = $3,
      blood_group = $4,
      emergency_contact_name = $5,
      emergency_contact_phone = $6
    WHERE user_id = $7 
    RETURNING user_id
    `,
    [
      date_of_birth || null,
      age || null,
      address || null,
      blood_group || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
      patientId,
    ]
  );

  return profileUpdate.rows[0];
};
