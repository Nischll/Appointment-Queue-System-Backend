import Joi from "joi";
import GENDER_TYPE from "../enums/genderType.enum.js";

const genderValues = Object.values(GENDER_TYPE);

/** Editable profile fields only (no role_id, user_type, isactive). */
export const updatePatientProfileSchema = Joi.object({
  full_name: Joi.string().trim().max(100).allow(""),
  username: Joi.string().trim().max(50).allow(""),
  email: Joi.string().trim().email().max(100).allow(""),
  phone: Joi.string().trim().max(20).allow(""),
  gender: Joi.string()
    .valid(...genderValues)
    .allow(""),
  date_of_birth: Joi.string()
    .trim()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow("", null),
  age: Joi.number().integer().min(0).max(150).allow(null),
  address: Joi.string().trim().max(2000).allow(""),
  blood_group: Joi.string().trim().max(5).allow(""),
  emergency_contact_name: Joi.string().trim().max(100).allow(""),
  emergency_contact_phone: Joi.string().trim().max(20).allow(""),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required to update.",
  });

/** Change password payload. */
export const changePasswordSchema = Joi.object({
  old_password: Joi.string().required().messages({
    "string.empty": "Current password is required.",
  }),
  new_password: Joi.string().min(8).required().pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/).messages({
    "string.min": "New password must be at least 8 characters long.",
    "string.pattern.base":
      "New password must contain at least one letter and one number.",
  }),
  confirm_password: Joi.string().valid(Joi.ref("new_password")).required().messages({
    "any.only": "New password and confirm password do not match.",
  }),
});
