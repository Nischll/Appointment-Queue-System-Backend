import {
  addDoctorClinicQuery,
  createDoctorQuery,
  findDoctorByEmail,
  getDoctorByClinicQuery,
} from "../models/doctorModels.js";

export const createDoctorService = async (data) => {
  if (!data.clinic_id || data.clinic_id.length === 0) {
    throw new Error("At least one clinic is required.");
  }

  let doctor = await findDoctorByEmail(data.email);

  if (!doctor) {
    doctor = await createDoctorQuery(data);
  }

  await addDoctorClinicQuery(doctor.id, data.clinic_id);

  return doctor.id;
};

export const getDoctorByClinic = async (clinicId) => {
  if (!clinicId) {
    throw new Error("Clinic is required to fetch Doctors");
  }

  return await getDoctorByClinicQuery(clinicId);
};
