import { createRoleService } from "../services/roleService.js";
import { sendResponse } from "../utils/response.js";

export const createRole = async (req, res) => {
  try {
    const { role_name, code, description } = req.body;

    if (!role_name || !code) {
      return sendResponse(res, 400, "role_name and code are required", null);
    }

    const data = await createRoleService({ role_name, code, description });
    return sendResponse(res, 200, "Role created successfully", data);
  } catch (error) {
    return sendResponse(res, 500, error.message, null);
  }
};
