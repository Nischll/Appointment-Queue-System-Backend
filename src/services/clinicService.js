import {
  checkClinicExistQuery,
  createClinicQuery,
  deleteClinicQuery,
  getAllClinicQuery,
  updateClinicQuery,
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

export const updateClinicService = async (clinicId, clinicDto) => {
  const updatedClinic = await updateClinicQuery(clinicId, clinicDto);

  if (!updatedClinic) {
    throw new Error("Clinic not found.");
  }

  return updatedClinic;
};

export const deleteClinicService = async (clinicId) => {
  const deletedClinic = await deleteClinicQuery(clinicId);

  if (!deletedClinic) {
    throw new Error("Clinic not foound");
  }

  return deletedClinic;
};
