import pool from "../config/db.js";
import { getAllModulesQuery } from "../models/initModels.js";
import {
  checkPermissionExistQuery,
  getRolePermissionsQuery,
  insertPermissionQuery,
  updatepermissionQuery,
} from "../models/rolePermissionsModel.js";

export const getRolePermissionService = async (roleId) => {
  // ADMIN role special case
  if (roleId === 1) return null;

  // Check if role exists
  const roleResult = await pool.query(
    "SELECT id, role_name FROM roles WHERE id = $1",
    [roleId]
  );
  if (roleResult.rows.length === 0) {
    throw new Error(`Role with id ${roleId} does not exist`);
  }

  const permissions = await getRolePermissionsQuery(roleId);
  if (permissions.length === 0) {
    // fetch all modules and return default false permissions
    const modules = await getAllModulesQuery();
    return modules.map((m) => ({
      module_id: m.id,
      name: m.name,
      code: m.code,
      can_read: false,
      can_write: false,
      can_update: false,
      can_delete: false,
    }));
  }

  return permissions;
};

export const updateRolePermissionService = async (roleId, permissions) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const p of permissions) {
      const exists = await checkPermissionExistQuery(roleId, p.module_id);

      if (exists.rows.length > 0) {
        await updatepermissionQuery(roleId, p.module_id, p);
      } else {
        await insertPermissionQuery(roleId, p.module_id, p);
      }
    }
    await client.query("COMMIT"); 
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
