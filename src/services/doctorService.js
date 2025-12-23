import {
  addDoctorClinicQuery,
  createDoctorQuery,
  deleteDoctorQuery,
  findDoctorByEmail,
  getDoctorByClinicQuery,
  updateDoctorQuery,
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

export const getDoctorByClinicService = async (clinicId) => {
  if (!clinicId) {
    throw new Error("Clinic is required to fetch Doctors");
  }

  return await getDoctorByClinicQuery(clinicId);
};

export const updateDoctorService = async (doctorId, data) => {
  if (!doctorId) {
    throw new Error("Doctor is required.");
  }

  if (data.email) {
    const existingDoctor = await findDoctorByEmail(data.email);
    if (existingDoctor && existingDoctor.id !== Number(doctorId)) {
      throw new Error("Provided email is belong to other doctor.");
    }
  }

  const updatedDoctor = await updateDoctorQuery(doctorId, data);

  if (!updatedDoctor) {
    throw new Error("Doctor not found.");
  }

  return updatedDoctor;
};

export const deleteDoctorService = async (doctorId, clinicId) => {
  if (!doctorId || !clinicId) {
    throw new Error("Doctor id and clinic id are required.");
  }

  const deletedDoctor = await deleteDoctorQuery(doctorId, clinicId);

  if (!deletedDoctor) {
    throw new Error("Doctor not found for this clinic.");
  }

  return deletedDoctor;
};
