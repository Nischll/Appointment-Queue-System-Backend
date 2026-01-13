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

export const getAllRolesQuery = async () => {
  const result = await pool.query(
    `
    SELECT id, role_name, code, description
    FROM roles
    WHERE id <> 1 AND code <> 'SUPERADMIN'
    ORDER BY id ASC
    `
  );
  return result.rows;
};

export const updateRoleQuery = async (roleId, roleData) => {
  const { role_name, code, description } = roleData;

  const result = await pool.query(
    `UPDATE roles
      SET role_name = $1,
          code = $2,
          description = $3
        where id = $4
        RETURNING *`,
    [role_name, code, description, roleId]
  );

  return result.rows[0].id;
};
