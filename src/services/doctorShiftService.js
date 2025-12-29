import pool from "../config/db.js";
import {
  checkDoctorShiftOverlapQuery,
  deleteDoctorShiftByIdQuery,
  getDoctorShiftsQuery,
  insertDoctorShiftsQuery,
  updateDoctorShiftQuery,
} from "../models/doctorShiftModels.js";

const getClinicIdByDepartment = async (departmentId) => {
  const result = await pool.query(
    `SELECT clinic_id FROM departments WHERE id = $1`,
    [departmentId]
  );
  if (result.rows.length === 0) throw new Error("Department not found");
  return result.rows[0].clinic_id;
};

export const updateDoctorShiftService = async (
  doctorId,
  departmentId,
  shifts
) => {
  if (!doctorId || !departmentId) {
    throw new Error("Doctor and department are required");
  }

  const clinicId = await getClinicIdByDepartment(departmentId);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingShifts = await getDoctorShiftsQuery(
      doctorId,
      departmentId,
      clinicId
    );

    const incomingDaySet = new Set();

    for (const s of shifts) {
      if (!s.is_day_off && (!s.start_time || !s.end_time)) {
        throw new Error("Start time and end time are required");
      }
      // Update existing shift if same day exists, else insert
      const existingShift = existingShifts.find(
        (es) => es.day_of_week === s.day_of_week
      );

      // Check overlap across ALL clinics for this doctor
      if (!s.is_day_off) {
        const hasOverlap = await checkDoctorShiftOverlapQuery(
          client,
          doctorId,
          s.day_of_week,
          s.start_time,
          s.end_time,
          existingShift ? existingShift.id : null
        );

        if (hasOverlap) {
          throw new Error(
            `Doctor already has a shift on day ${s.day_of_week} during this time in another department or clinic`
          );
        }
      }

      if (existingShift) {
        await updateDoctorShiftQuery(client, existingShift.id, s);
        incomingDaySet.add(existingShift.day_of_week);
      } else {
        await insertDoctorShiftsQuery(
          client,
          doctorId,
          departmentId,
          clinicId,
          [s]
        );
        incomingDaySet.add(s.day_of_week);
      }
    }

    // Delete removed shifts
    for (const es of existingShifts) {
      if (!incomingDaySet.has(es.day_of_week)) {
        await deleteDoctorShiftByIdQuery(client, es.id);
      }
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

  const clinicId = await getClinicIdByDepartment(departmentId);

  return await getDoctorShiftsQuery(doctorId, departmentId, clinicId);
};
