import {
  checkClinicExistQuery,
  createClinicQuery,
  getAllClinicQuery,
} from "../models/clinicModel.js";

export const createClinicService = async (data) => {
  const exits = await checkClinicExistQuery(data.name);

  if (exits) {
    throw new Error("Clinic with this name already exists.");
  }
  return await createClinicQuery(data);
};

export const getAllClinicService = async () => {
  return await getAllClinicQuery();
};
