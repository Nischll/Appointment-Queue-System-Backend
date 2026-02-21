import Joi from "joi";
import GENDER_TYPE from "../enums/genderType.enum.js";

const genderValues = Object.values(GENDER_TYPE);

/** Editable profile fields only (no role, roleCode, isActive, permissions). */
export const updateStaffProfileSchema = Joi.object({
  full_name: Joi.string().trim().max(100).allow(""),
  username: Joi.string().trim().max(50).allow(""),
  email: Joi.string().trim().email().max(100).allow(""),
  phone: Joi.string().trim().max(20).allow(""),
  gender: Joi.string()
    .valid(...genderValues)
    .allow(""),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required to update.",
  });

/** Change password payload. New password must differ from old (enforced in service). */
export const changePasswordSchema = Joi.object({
  old_password: Joi.string().required().messages({
    "string.empty": "Current password is required.",
  }),
  new_password: Joi.string()
    .min(8)
    .required()
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
    .messages({
      "string.min": "New password must be at least 8 characters long.",
      "string.pattern.base":
        "New password must contain at least one letter and one number.",
    }),
  confirm_password: Joi.string()
    .valid(Joi.ref("new_password"))
    .required()
    .messages({
      "any.only": "New password and confirm password do not match.",
    }),
});
