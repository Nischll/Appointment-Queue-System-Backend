import bcrypt from "bcrypt";
import pool from "../config/db.js";
import {
  getInternalUserByIdQuery,
  getInternalUserPasswordQuery,
  updateInternalUserEditableFieldsQuery,
  updateInternalUserPasswordQuery,
} from "../models/staffProfileModel.js";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

/**
 * Get profile for the authenticated Staff/Superadmin (from users table only).
 * Response shape aligned with init API: fullName, username, email, phone, gender, role, roleCode, isActive.
 */
export const getMyProfileService = async (userId) => {
  const user = await getInternalUserByIdQuery(userId);
  if (!user) {
    const error = new Error("Profile not found.");
    error.statusCode = 404;
    throw error;
  }
  return formatProfileResponse(user);
};

/**
 * Update authenticated Staff/Superadmin profile. Only editable fields allowed.
 */
export const updateMyProfileService = async (userId, body) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userFields = {
      full_name: body.full_name ?? null,
      username: body.username ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      gender: body.gender ?? null,
    };

    const updated = await updateInternalUserEditableFieldsQuery(
      client,
      userId,
      userFields
    );
    if (!updated) {
      await client.query("ROLLBACK");
      const error = new Error("Profile not found.");
      error.statusCode = 404;
      throw error;
    }

    await client.query("COMMIT");
    return await getInternalUserByIdQuery(userId).then(formatProfileResponse);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Change password: verify old, validate new (strong, different from old), hash and save.
 */
export const changePasswordService = async (
  userId,
  { old_password, new_password, confirm_password }
) => {
  if (new_password !== confirm_password) {
    const error = new Error("New password and confirm password do not match.");
    error.statusCode = 400;
    throw error;
  }

  if (old_password === new_password) {
    const error = new Error("New password must be different from current password.");
    error.statusCode = 400;
    throw error;
  }

  if (new_password.length < PASSWORD_MIN_LENGTH) {
    const error = new Error(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`
    );
    error.statusCode = 400;
    throw error;
  }

  if (!PASSWORD_REGEX.test(new_password)) {
    const error = new Error(
      "Password must contain at least one letter and one number."
    );
    error.statusCode = 400;
    throw error;
  }

  const userRow = await getInternalUserPasswordQuery(userId);
  if (!userRow) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const isOldCorrect = await bcrypt.compare(old_password, userRow.password);
  if (!isOldCorrect) {
    const error = new Error("Current password is incorrect.");
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(new_password, 10);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await updateInternalUserPasswordQuery(client, userId, hashedPassword);
    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

function formatProfileResponse(row) {
  if (!row) return null;
  return {
    // userId: row.id,
    fullName: row.full_name,
    username: row.username,
    email: row.email,
    phone: row.phone,
    gender: row.gender,
  };
}
