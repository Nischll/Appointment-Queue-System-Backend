import pool from "../config/db.js";

export const findDoctorByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM doctors WHERE email = $1 AND status = TRUE`,
    [email]
  );
  return result.rows[0] || null;
};

export const createDoctorQuery = async ({ name, phone, email }) => {
  const result = await pool.query(
    `
    INSERT INTO doctors (name, phone, email)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [name, phone, email]
  );
  return result.rows[0];
};

/* ---------------- DOCTOR ↔ DEPARTMENT ---------------- */

export const addDoctorToDepartmentsQuery = async (doctorId, departmentIds) => {
  if (!departmentIds || departmentIds.length === 0) {
    throw new Error("At least one department is required.");
  }

  const values = departmentIds.map((_, idx) => `($1, $${idx + 2})`).join(", ");

  const params = [doctorId, ...departmentIds];

  await pool.query(
    `
    INSERT INTO doctor_departments (doctor_id, department_id)
    VALUES ${values}
    ON CONFLICT (doctor_id, department_id) DO NOTHING
    `,
    params
  );
};

export const getDoctorsByDepartmentQuery = async (departmentId) => {
  const result = await pool.query(
      `
      SELECT
        d.id,
        d.name,
        d.phone,
        d.email,
        
        de.id AS department_id,
        de.name AS department_name,

        c.id AS clinic_id,
        c.name AS clinic_name,

        CASE WHEN ds.is_day_off = TRUE THEN NULL ELSE ds.start_time END AS today_start_time,
        CASE WHEN ds.is_day_off = TRUE THEN NULL ELSE ds.end_time END AS today_end_time,
        COALESCE(ds.is_day_off, FALSE) AS is_day_off

      FROM doctor_departments dd
      JOIN doctors d 
        ON d.id = dd.doctor_id
      JOIN departments de 
        ON de.id = dd.department_id
      JOIN clinics c 
        ON c.id = de.clinic_id

      LEFT JOIN doctor_shifts ds
        ON ds.doctor_id = d.id
          AND ds.department_id = dd.department_id
          AND ds.clinic_id = c.id
          AND ds.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)

      WHERE dd.department_id = $1
        AND dd.status = TRUE
        AND d.status = TRUE
      ORDER BY d.name
    `,
    [departmentId]
  );

  return result.rows;
};

export const updateDoctorQuery = async (doctorId, data) => {
  const { name, phone, email } = data;

  const result = await pool.query(
    `
    UPDATE doctors
    SET
      name = COALESCE($1, name),
      phone = COALESCE($2, phone),
      email = COALESCE($3, email)
    WHERE id = $4
      AND status = TRUE
    RETURNING *
    `,
    [name, phone, email, doctorId]
  );

  return result.rows[0] || null;
};


export const removeDoctorFromDepartmentQuery = async (
  doctorId,
  departmentId
) => {
  const result = await pool.query(
    `
    UPDATE doctor_departments
    SET status = FALSE
    WHERE doctor_id = $1
      AND department_id = $2
      AND status = TRUE
    RETURNING doctor_id
    `,
    [doctorId, departmentId]
  );

  return result.rows[0] || null;
};
