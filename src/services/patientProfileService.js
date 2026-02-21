import bcrypt from "bcrypt";
import {
  getPatientProfileByUserIdQuery,
  getPatientProfileRowQuery,
  getUserPasswordQuery,
  insertPatientProfileQuery,
  updatePatientProfileFieldsQuery,
  updateUserEditableFieldsQuery,
  updateUserPasswordQuery,
} from "../models/patientProfileModel.js";
import pool from "../config/db.js";

/** Strong password pattern: min 8 chars, at least one letter and one number. */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

/**
 * Get combined profile for the authenticated patient (users + patient_profiles).
 */
export const getMyProfileService = async (userId) => {
  const profile = await getPatientProfileByUserIdQuery(userId);
  if (!profile) {
    const error = new Error("Patient profile not found.");
    error.statusCode = 404;
    throw error;
  }
  return formatProfileResponse(profile);
};

/**
 * Update authenticated patient's profile. Only editable fields are allowed.
 * Creates patient_profiles row if it does not exist.
 */
export const updateMyProfileService = async (userId, body) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingProfile = await getPatientProfileRowQuery(userId);

    const userFields = {
      full_name: body.full_name ?? null,
      username: body.username ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      gender: body.gender ?? null,
    };
    const profileFields = {
      date_of_birth: body.date_of_birth ?? null,
      age: body.age != null && body.age !== "" ? Number(body.age) : null,
      address: body.address ?? null,
      blood_group: body.blood_group ?? null,
      emergency_contact_name: body.emergency_contact_name ?? null,
      emergency_contact_phone: body.emergency_contact_phone ?? null,
    };

    await updateUserEditableFieldsQuery(client, userId, userFields);

    if (existingProfile) {
      await updatePatientProfileFieldsQuery(client, userId, profileFields);
    } else {
      if (body.date_of_birth == null && (body.age == null || body.age === "")) {
        await client.query("ROLLBACK");
        const error = new Error(
          "Patient profile requires at least date_of_birth or age."
        );
        error.statusCode = 400;
        throw error;
      }
      await insertPatientProfileQuery(client, userId, {
        ...profileFields,
        date_of_birth: body.date_of_birth ?? null,
        age: body.age != null && body.age !== "" ? Number(body.age) : null,
      });
    }

    await client.query("COMMIT");
    return await getPatientProfileByUserIdQuery(userId).then(formatProfileResponse);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Change password: verify old password, validate new password, hash and save.
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

  const userRow = await getUserPasswordQuery(userId);
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
    await updateUserPasswordQuery(client, userId, hashedPassword);
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
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    username: row.username,
    phone: row.phone,
    gender: row.gender,
    // user_type: row.user_type,
    // isactive: row.isactive,
    // created_at: row.created_at,
    profile: {
      date_of_birth: row.date_of_birth,
      age: row.age,
      address: row.address,
      blood_group: row.blood_group,
      emergency_contact_name: row.emergency_contact_name,
      emergency_contact_phone: row.emergency_contact_phone,
      // profile_created_at: row.profile_created_at,
      // profile_updated_at: row.profile_updated_at,
    },
  };
}
