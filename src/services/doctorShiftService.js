import pool from "../config/db.js";
import {
  checkDoctorShiftOverlapQuery,
  deleteDoctorShiftsQuery,
  getDoctorShiftsQuery,
  insertDoctorShiftsQuery,
} from "../models/doctorShiftModels.js";

export const updateDoctorShiftService = async (doctorId, clinicId, shifts) => {
  if (!doctorId || !clinicId) {
    throw new Error("Doctor and Clinic are required");
  }

  if (!Array.isArray(shifts)) {
    throw new Error("Shifts must be an array");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Overlap check (uses SAME transaction)
    for (const s of shifts) {
      if (s.is_day_off) continue;

      if (!s.start_time || !s.end_time) {
        throw new Error("Start time and end time are required");
      }

      const overlap = await checkDoctorShiftOverlapQuery(
        client,
        doctorId,
        s.day_of_week,
        s.start_time,
        s.end_time,
        clinicId
      );

      if (overlap) {
        throw new Error(
          `Doctor already has a shift on day ${s.day_of_week} during this time in another clinic`
        );
      }
    }

    // Delete only after overlap validation
    await deleteDoctorShiftsQuery(client, doctorId, clinicId);

    // Insert new shifts
    await insertDoctorShiftsQuery(client, doctorId, clinicId, shifts);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getDoctorShiftsService = async (doctorId, clinicId) => {
  if (!doctorId || !clinicId) {
    throw new Error("Doctor and Clinic are required");
  }

  return await getDoctorShiftsQuery(doctorId, clinicId);
};
