import pool from "../config/db.js";
import USER_TYPE from "../enums/userType.enum.js";
import { sendResponse } from "../utils/response.js";

/**
 * authorizeModuleAction
 * Checks if the logged-in user's role has permission for a module + specific action.
 * Optionally, allows API-level exceptions even if module read is false.
 *
 * @param {string} moduleCode - module code (e.g., "UM", "RM", "D")
 * @param {"read"|"write"|"update"|"delete"} action - required action
 * @param {boolean} allowApiOnly - allow API access even if module is hidden
 */
export const authorizeModule = (
  moduleCode,
  action = "read",
  allowApiOnly = false
) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return sendResponse(res, 403, "Access denied", null);
      }

      const { user_type, roleCode } = req.user;

      // EXTERNAL users (patients) are never allowed here
      if (user_type === USER_TYPE.External) {
        return sendResponse(
          res,
          403,
          "Patient users are not allowed to access this resource",
          null
        );
      }

      // INTERNAL user must have a role
      if (user_type === USER_TYPE.Internal && !roleCode) {
        return sendResponse(res, 403, "Role not assigned", null);
      }

      // Admin bypass
      if (roleCode === "SUPERADMIN" || user_type === USER_TYPE.SuperAdmin) return next();

      // Fetch permissions for the module
      const query = `
        SELECT rp.can_read, rp.can_write, rp.can_update, rp.can_delete
        FROM roles r
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN modules m ON rp.module_id = m.id
        WHERE r.code = $1 AND m.code = $2
      `;
      const result = await pool.query(query, [roleCode, moduleCode]);

      // Module not found in permissions
      if (result.rows.length === 0) {
        return sendResponse(
          res,
          403,
          "You do not have permission to access this module",
          null
        );
      }

      const perms = result.rows[0];
      const actionMap = {
        read: "can_read",
        write: "can_write",
        update: "can_update",
        delete: "can_delete",
      };

      // If the action is read, must always check can_read
      if (action === "read" && !perms.can_read) {
        return sendResponse(
          res,
          403,
          "You do not have permission to read this module",
          null
        );
      }

      // For other actions, either can_read must be true OR API-only exception is allowed
      if (action !== "read" && !perms[actionMap[action]]) {
        if (!allowApiOnly || !perms.can_read) {
          return sendResponse(
            res,
            403,
            `You do not have permission to ${action} this module`,
            null
          );
        }
      }

      next();
    } catch (error) {
      console.error("authorizeModuleAction error:", error);
      return sendResponse(res, 500, "Internal Server Error", null);
    }
  };
};
