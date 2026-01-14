import pool from "../config/db.js";

export const getAllPatientQuery = async () => {
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
    WHERE u.user_type = 'EXTERNAL' AND u.isactive = TRUE
    ORDER BY u.id ASC
    `
  );

  return result.rows;
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
