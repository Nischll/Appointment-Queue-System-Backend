import { updatePermissionSchema } from "../dto/permissionDto.js";
import {
  getRolePermissionService,
  updateRolePermissionService,
} from "../services/rolePermissionsService.js";
import { sendResponse } from "../utils/response.js";

export const getRolePermissions = async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    const data = await getRolePermissionService(roleId);

    if (roleId === 1) {
      // Admin: no need to manage permissions
      return sendResponse(res, 200, "Admin has full access", null);
    }

    return sendResponse(res, 200, "Successfully retrieved permissions", data);
  } catch (error) {
    return sendResponse(res, 500, "Internal Server Error", null);
  }
};

export const updateRolePermissions = async (req, res) => {
  try {
    const roleId = req.params.id;
    const { error } = updatePermissionSchema.validate(req.body);
    if (error) {
      return sendResponse(res, 400, error.message, null);
    }
    
    await updateRolePermissionService(roleId, req.body);
    return sendResponse(res, 200, "Permissions updated successfully", null);
  } catch (error) {
    console.error("Error updating role permissions:", error);
    return sendResponse(res, 500, "Internal Server Error", null);
  }
};
