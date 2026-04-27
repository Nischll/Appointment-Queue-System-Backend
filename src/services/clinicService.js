import {
  checkClinicActiveDepartmentsQuery,
  checkClinicActiveDoctorsQuery,
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
  if (!clinicId) {
    throw new Error("Clinic id is required.");
  }

  const activeDepartments = await checkClinicActiveDepartmentsQuery(clinicId);
  if (activeDepartments.count > 0) {
    const error = new Error(
      `Cannot remove clinic. It has ${activeDepartments.count} active department(s). Please remove all departments first.`,
    );
    error.code = "DEPARTMENT_CONFLICT";
    throw error;
  }

  const activeDoctors = await checkClinicActiveDoctorsQuery(clinicId);
  if (activeDoctors.count > 0) {
    const error = new Error(
      `Cannot remove clinic. It has ${activeDoctors.count} active doctor(s) assigned. Please remove all doctors first.`,
    );
    error.code = "DOCTOR_CONFLICT";
    throw error;
  }

  const deletedClinic = await deleteClinicQuery(clinicId);
  if (!deletedClinic) {
    throw new Error("Clinic not found.");
  }

  return deletedClinic;
};
