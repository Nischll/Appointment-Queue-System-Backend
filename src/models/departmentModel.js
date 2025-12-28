import pool from "../config/db.js";

export const createDepartmentQuery = async (data) => {
  const { clinic_id, name } = data;

  const result = await pool.query(
    `
      INSERT INTO departments (clinic_id, name) 
      VALUES ($1, $2)
      RETURNING *
    `,
    [clinic_id, name]
  );

  return result.rows[0];
};

export const getDepartmentByClinicQuery = async (clinicId) => {
  const result = await pool.query(
    `
      SELECT id, name
      FROM departments
      WHERE clinic_id = $1
        AND status = TRUE
      ORDER BY name ASC
    `,
    [clinicId]
  );
  return result.rows;
};

export const findDepartmentByNameQuery = async (clinicId, name) => {
  const result = await pool.query(
    `
    SELECT id
    FROM departments
    WHERE clinic_id = $1
      AND LOWER(name) = LOWER($2)
      AND status = TRUE
    `,
    [clinicId, name]
  );

  return result.rows[0] || null;
};

export const updateDepartmentQuery = async (departmentId, data) => {
  const { name, clinic_id } = data;
  const result = await pool.query(
    `
      UPDATE departments
      SET 
        name = COALESCE($1, name),
        clinic_id = COALESCE($2, clinic_id)
      WHERE id = $3
        AND status = TRUE
      RETURNING *
    `,
    [name, clinic_id, departmentId]
  );

  return result.rows[0] || null;
};

export const deleteDepartmentQuery = async (departmentId) => {
  const result = await pool.query(
    `
      UPDATE departments
      SET status = FALSE
      WHERE id = $1
        AND status = TRUE
      RETURNING *
    `,
    [departmentId]
  );

  return result.rows[0] || null;
};
