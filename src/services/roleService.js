import { getAllModulesQuery } from "../models/initModels.js";
import { createRoleQuery } from "../models/roleModel.js";
import { insertPermissionQuery } from "../models/rolePermissionsModel.js";

export const createRoleService = async (dto) => {
  // Create Role first
  const newRole = await createRoleQuery(dto);

  const newRoleId = newRole.id; // IMPORTANT

  //  Fetch all modules
  const modules = await getAllModulesQuery();

  //  Insert default permissions for this new role
  for (const m of modules) {
    await insertPermissionQuery(newRoleId, m.id, {
      canRead: false,
      canWrite: false,
      canUpdate: false,
      canDelete: false,
    });
  }

  return newRole.id;
};
