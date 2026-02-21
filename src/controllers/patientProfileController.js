import {
  changePasswordService,
  getMyProfileService,
  updateMyProfileService,
} from "../services/patientProfileService.js";
import { sendResponse } from "../utils/response.js";
import {
  changePasswordSchema,
  updatePatientProfileSchema,
} from "../validators/patientProfileValidator.js";

/**
 * GET /patient/profile
 * Returns the authenticated patient's combined profile (users + patient_profiles).
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
 * PUT /patient/profile
 * Updates the authenticated patient's profile. Only editable fields accepted.
 * Creates patient_profiles row if it does not exist.
 */
export const updateMyProfile = async (req, res) => {
  try {
    const { error: validationError, value } =
      updatePatientProfileSchema.validate(req.body, {
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
    return sendResponse(res, 200, "Profile updated successfully", data);
  } catch (error) {
    console.error("updateMyProfile error", error);
    const statusCode = error.statusCode || 500;
    return sendResponse(res, statusCode, error.message || "Failed to update profile", null);
  }
};

/**
 * POST /patient/profile/change-password
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
