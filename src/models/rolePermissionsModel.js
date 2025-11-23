import pool from "../config/db.js";

export const getRolePermissionsQuery = async (roleId) => {
  const query = `
    SELECT 
        m.id AS module_id,
        m.name,
        m.code,
        rp.can_read,
        rp.can_write,
        rp.can_update,
        rp.can_delete
    FROM modules m
    JOIN role_permissions rp ON rp.module_id = m.id
    JOIN roles r ON r.id = rp.role_id
    WHERE r.id = $1
    ORDER BY m.parent_id NULLS FIRST, m.orders ASC
  `;

  const result = await pool.query(query, [roleId]);
  return result.rows;
};

export const checkPermissionExistQuery = async (roleId, moduleId) => {
  const query = `
    SELECT role_id, module_id
    FROM role_permissions 
    WHERE role_id = $1 AND module_id = $2
  `;

  return pool.query(query, [roleId, moduleId]);
};

export const insertPermissionQuery = async (roleId, moduleId, p) => {
  const query = `
    INSERT INTO role_permissions
    (role_id, module_id, can_read, can_write, can_update, can_delete)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;

  return pool.query(query, [
    roleId,
    moduleId,
    p.canRead,
    p.canWrite,
    p.canUpdate,
    p.canDelete,
  ]);
};

export const updatepermissionQuery = async (roleId, moduleId, p) => {
  const query = `
    UPDATE role_permissions SET 
      can_read = $1,
      can_write = $2,
      can_update = $3,
      can_delete = $4
     WHERE role_id = $5 AND module_id = $6

  `;

  return pool.query(query, [
    p.canRead,
    p.canWrite,
    p.canUpdate,
    p.canDelete,
    roleId,
    moduleId,
  ]);
};
