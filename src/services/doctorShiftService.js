import pool from "../config/db.js";
import { deleteDoctorShiftsQuery, insertDoctorShiftsQuery } from "../models/doctorShiftModels.js";

export const updateDoctorShiftService = async (doctorId, clinicId, shifts) => {
  if (!doctorId || !clinicId) {
    throw new Error("Doctor and Clinic are required", 400);
  }

  if (!Array.isArray(shifts)) {
    throw new Error("Shifts must be an array", 400);
  }

  try {
    await pool.query("BEGIN");
    await deleteDoctorShiftsQuery(doctorId, clinicId);
    await insertDoctorShiftsQuery(doctorId, clinicId, shifts);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
