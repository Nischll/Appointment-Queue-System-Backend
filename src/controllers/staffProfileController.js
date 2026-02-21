import {
  changePasswordService,
  getMyProfileService,
  updateMyProfileService,
} from "../services/staffProfileService.js";
import { sendResponse } from "../utils/response.js";
import {
  changePasswordSchema,
  updateStaffProfileSchema,
} from "../validators/staffProfileValidator.js";

/**
 * GET /api/profile
 * Returns the authenticated Staff/Superadmin profile (from users table).
 */
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await getMyProfileService(userId);
    return sendResponse(res, 200, "Profile fetched successfully", data);
  } catch (error) {
    console.error("getMyProfile error", error);
    const statusCode = error.statusCode || 500;
    const message =
      error.statusCode === 404 ? error.message : "Failed to fetch profile";
    return sendResponse(res, statusCode, message, null);
  }
};

/**
 * PUT /api/profile
 * Updates the authenticated Staff/Superadmin profile. Only editable fields accepted.
 */
export const updateMyProfile = async (req, res) => {
  try {
    const { error: validationError, value } =
      updateStaffProfileSchema.validate(req.body, {
        stripUnknown: true,
        abortEarly: false,
      });

    if (validationError) {
      const message = validationError.details
        .map((d) => d.message)
        .join("; ");
      return sendResponse(res, 400, message, null);
    }

    const userId = req.user.id;
    const data = await updateMyProfileService(userId, value);
    return sendResponse(res, 200, "Profile updated successfully", null);
  } catch (error) {
    console.error("updateMyProfile error", error);
    const statusCode = error.statusCode || 500;
    return sendResponse(
      res,
      statusCode,
      error.message || "Failed to update profile",
      null
    );
  }
};

/**
 * POST /api/profile/change-password
 * Changes password after verifying old password and validating new one.
 */
export const changePassword = async (req, res) => {
  try {
    const { error: validationError, value } = changePasswordSchema.validate(
      req.body,
      { stripUnknown: true, abortEarly: false }
    );

    if (validationError) {
      const message = validationError.details
        .map((d) => d.message)
        .join("; ");
      return sendResponse(res, 400, message, null);
    }

    const userId = req.user.id;
    await changePasswordService(userId, {
      old_password: value.old_password,
      new_password: value.new_password,
      confirm_password: value.confirm_password,
    });
    return sendResponse(res, 200, "Password changed successfully", null);
  } catch (error) {
    console.error("changePassword error", error);
    const statusCode = error.statusCode || 500;
    return sendResponse(
      res,
      statusCode,
      error.message || "Failed to change password",
      null
    );
  }
};
