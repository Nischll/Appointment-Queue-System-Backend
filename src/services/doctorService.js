import pool from "../config/db.js";
import { DoctorDto } from "../dto/doctorDto.js";
import {
  addDoctorToDepartmentsQuery,
  createDoctorQuery,
  findDoctorByEmail,
  getDoctorsByDepartmentQuery,
  getPatientDoctorsQuery,
  removeDoctorFromDepartmentQuery,
  updateDoctorQuery,
} from "../models/doctorModels.js";

export const createDoctorService = async (data) => {
  if (!data.department_id || data.department_id.length === 0) {
    throw new Error("At least one department is required.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const dto = new DoctorDto(data);

    let doctor = await findDoctorByEmail(dto.email);

    if (!doctor) {
      doctor = await createDoctorQuery(dto, client);
    }

    await addDoctorToDepartmentsQuery(doctor.id, data.department_id, client);

    await client.query("COMMIT");
    return doctor.id;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getDoctorsByDepartmentService = async (departmentId) => {
  if (!departmentId) {
    throw new Error("Department is required to fetch Doctors");
  }

  return await getDoctorsByDepartmentQuery(departmentId);
};

export const updateDoctorService = async (doctorId, data) => {
  if (!doctorId) {
    throw new Error("Doctor is required.");
  }

  if (data.email) {
    const existingDoctor = await findDoctorByEmail(data.email);
    if (existingDoctor && existingDoctor.id !== Number(doctorId)) {
      throw new Error("Provided email belongs to another doctor.");
    }
  }

  const updatedDoctor = await updateDoctorQuery(doctorId, data);

  if (!updatedDoctor) {
    throw new Error("Doctor not found.");
  }

  return updatedDoctor;
};

export const removeDoctorFromDepartmentService = async (
  doctorId,
  departmentId,
) => {
  if (!doctorId || !departmentId) {
    throw new Error("Doctor and department id are required.");
  }

  const removed = await removeDoctorFromDepartmentQuery(doctorId, departmentId);

  if (!removed) {
    throw new Error("Doctor not found for this department.");
  }

  return removed;
};

// PATIENT
export const getPatientDoctorsService = async ({ clinicId, date }) => {
  if (!clinicId) {
    throw new Error("Clinic is required");
  }

  if (!date) {
    throw new Error("Date is required");
  }

  const selectedDate = new Date(date);
  if (isNaN(selectedDate.getTime())) {
    throw new Error("Invalid date format");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    throw new Error("Past date is not allowed");
  }
  const dayOfWeek = selectedDate.getDay();

  return await getPatientDoctorsQuery({
    clinicId,
    dayOfWeek,
  });
};
