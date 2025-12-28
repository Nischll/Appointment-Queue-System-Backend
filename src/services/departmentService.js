import {
  createDepartmentQuery,
  deleteDepartmentQuery,
  findDepartmentByNameQuery,
  getDepartmentByClinicQuery,
  updateDepartmentQuery,
} from "../models/departmentModel.js";

export const createDepartmentService = async (data) => {
  if (!data.clinic_id) {
    throw new Error("Clinic is required.");
  }

  if (!data.name) {
    throw new Error("Department Name is required.");
  }

  const existing = await findDepartmentByNameQuery(data.clinic_id, data.name);

  if (existing) {
    throw new Error("Department already exists for this clinic.");
  }

  return await createDepartmentQuery(data);
};

export const getDepartmentByClinicService = async (clinicId) => {
  if (!clinicId) {
    throw new Error("Clinic is required.");
  }

  return await getDepartmentByClinicQuery(clinicId);
};

export const updateDepartmentService = async (departmentId, data) => {
  if (!departmentId) {
    throw new Error("Department is required.");
  }

  if (data.name) {
    const existing = await findDepartmentByNameQuery(data.clinic_id, data.name);
    if (existing && existing.id !== Number(departmentId)) {
      throw new Error("Department name already exists.");
    }
  }

  const updated = await updateDepartmentQuery(departmentId, data);

  if (!updated) {
    throw new Error("Department not found.");
  }

  return updated;
};

export const deleteDepartmentService = async (departmentId) => {
  if (!departmentId) {
    throw new Error("Department is required.");
  }

  const deleted = await deleteDepartmentQuery(departmentId);

  if (!deleted) {
    throw new Error("Department not found.");
  }

  return deleted;
};
