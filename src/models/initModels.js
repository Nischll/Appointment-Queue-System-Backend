import pool from "../config/db.js";

export const getUserByIdQuery = async (userId) => {
  const result = await pool.query(
    `
    SELECT u.id, u.fullname, u.email, u.isactive, u.user_type, r.role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = $1
    `,
    [userId]
  );

  return result.rows[0]; 
};

export const getModulesByROleQuery = async (roleName) => {
  const query = `
    SELECT m.id, m.parent_id, m.name, m.code, m.icon, m.path
    FROM modules m
    JOIN role_permissions rp ON rp.module_id = m.id
    JOIN roles r ON r.id = rp.role_id
    WHERE r.role_name = $1 AND rp.can_read = true
    ORDER BY m.parent_id NULLS FIRST, m.orders ASC
  `;
  const result = await pool.query(query, [roleName]);
  return result.rows;
};

export const getAllModulesQuery = async () => {
  const query = `
    SELECT id, parent_id, name, code, icon, path
    FROM modules
    ORDER BY parent_id NULLS FIRST, orders ASC
  `;
  const result = await pool.query(query);
  return result.rows;
};
