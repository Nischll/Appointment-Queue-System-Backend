import { createClinicQuery } from "../models/clinicModel.js";

export const clinicService = async (data) => {
  return await createClinicQuery(data);
};
