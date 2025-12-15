import {
  createRoleService,
  getAllRoleService,
  updateRoleService,
} from "../services/roleService.js";
import { sendResponse } from "../utils/response.js";
import { RoleDto } from "../dto/roleDto.js";

export const createRole = async (req, res) => {
  try {
    const { role_name, code, description } = req.body;

    if (!role_name || !code) {
      return sendResponse(res, 400, "role_name and code are required", null);
    }

    const roleDto = new RoleDto(req.body);

    const data = await createRoleService(roleDto);
    return sendResponse(res, 200, "Role created successfully", data);
  } catch (error) {
    return sendResponse(res, 500, error.message, null);
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await getAllRoleService();
    res.json({
      status: 200,
      message: "Roles fetched successfully",
      data: roles,
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const roleId = req.params.id;

    const roleDto = new RoleDto(req.body);

    if (!roleDto.role_name || !roleDto.code) {
      return sendResponse(res, 400, "role_name and code are required", null);
    }

    const data = await updateRoleService(roleId, roleDto);

    return sendResponse(res, 200, "Role updated successfully.", data.roleId);
  } catch (err) {
    console.log(req.body);
    return sendResponse(res, 500, err.message, null);
  }
};
