import {
  checkClinicExistQuery,
  createClinicQuery,
  deleteClinicQuery,
  getAllClinicQuery,
  getClinicByStaffQuery,
  updateClinicQuery,
} from "../models/clinicModel.js";

export const createClinicService = async (data) => {
  const exits = await checkClinicExistQuery(data.name);

  if (exits) {
    throw new Error("Clinic with this name already exists.");
  }
  return await createClinicQuery(data);
};

function attachAddressToName(clinic) {
  const name = clinic.name || "";
  const address = clinic.address?.trim() || "";
  return { ...clinic, name: address ? `${name}- ${address}` : name };
}

export const getAllClinicService = async () => {
  const rows = await getAllClinicQuery();
  return rows.map(attachAddressToName);
};

export const getClinicByStaffService = async (userId) => {
  if (!userId) {
    throw new Error("user id is required.");
  }

  const rows = await getClinicByStaffQuery(userId);
  return rows.map(attachAddressToName);
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
