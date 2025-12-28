import pool from "../config/db.js";
import {
  checkDoctorShiftOverlapQuery,
  deleteDoctorShiftByIdQuery,
  deleteDoctorShiftsQuery,
  getDoctorShiftsQuery,
  insertDoctorShiftsQuery,
  updateDoctorShiftQuery,
} from "../models/doctorShiftModels.js";

export const updateDoctorShiftService = async (
  doctorId,
  departmentId,
  shifts
) => {
  if (!doctorId || !departmentId)
    throw new Error("Doctor and department are required");
  if (!Array.isArray(shifts)) throw new Error("Shifts must be an array");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get existing shifts
    const existingShifts = await getDoctorShiftsQuery(doctorId, departmentId);
    const existingShiftMap = new Map(
      existingShifts.map((s) => [s.day_of_week, s])
    );

    for (const s of shifts) {
      if (s.is_day_off) {
        s.start_time = null;
        s.end_time = null;
      } else {
        if (!s.start_time || !s.end_time)
          throw new Error("Start time and end time are required");
      }

      const existing = existingShiftMap.get(s.day_of_week);

      if (existing) {
        // Update existing shift via model
        await updateDoctorShiftQuery(client, existing.id, s);
        existingShiftMap.delete(s.day_of_week);
      } else {
        // Insert new shift via model
        await insertDoctorShiftsQuery(client, doctorId, departmentId, [s]);
      }
    }

    // Delete any removed shifts
    for (const remaining of existingShiftMap.values()) {
      await deleteDoctorShiftByIdQuery(client, remaining.id);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getDoctorShiftsService = async (doctorId, departmentId) => {
  if (!doctorId || !departmentId) {
    throw new Error("Doctor and department are required");
  }

  return await getDoctorShiftsQuery(doctorId, departmentId);
};
