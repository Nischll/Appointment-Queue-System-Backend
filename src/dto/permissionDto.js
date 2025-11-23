import Joi from "joi";

export const updatePermissionSchema = Joi.array().items(
  Joi.object({
    module_id: Joi.number().required(),
    canRead: Joi.boolean().required(),
    canWrite: Joi.boolean().required(),
    canUpdate: Joi.boolean().required(),
    canDelete: Joi.boolean().required(),
  })
);
