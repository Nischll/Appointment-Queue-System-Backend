import pool from "../config/db.js";
import APPOINTMENT_STATUS from "../enums/appointmentStatus.enum.js";
import {
  mapAppointmentHistory,
  mapAppointmentWithPrediction,
  mapPatientAppointmentWithPrediction,
} from "../mappers/appointmentMapper.js";
import {
  addPatientAppoinmentQuery,
  approveAppointmentQuery,
  assignQueueNumberQuery,
  cancelAppointmentQuery,
  checkAppointmentExistsQuery,
  checkDoctorInProgressQuery,
  checkDuplicateAppointmentQuery,
  checkDuplicatePatientRequestQuery,
  checkInAppointmentQuery,
  completeAppointmentQuery,
  getAppointmentHistoryQuery,
  getLiveAppointmentQuery,
  getNextQueueNumberQuery,
  getPatientAppointmentHistoryQuery,
  getPatientLiveAppointmentQuery,
  getPatientPendingAppointmentsQuery,
  getUpcomingAppointmentsQuery,
  insertAppointmentQuery,
  noShowAppointmentQuery,
  rejectAppointmentQuery,
  startAppointmentQuery,
  updateAppointmentQuery,
} from "../models/appointmentModel.js";
import { predictWaitTimeService } from "./predictWaitTimeService.js";

const APPOINTMENT_DURATION = {
  COUNSELLING: 30,
  REGULAR_CHECKUP: 15,
  FOLLOW_UP: 10,
  OPERATION: 60,
};

export const staffBookAppointmentService = async (staffId, data) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await checkDuplicateAppointmentQuery(client, data);

    if (existing) {
      throw new Error(
        "Patient already has an active appointment with this doctor on this date",
      );
    }

    const queueNumber = await assignQueueNumberQuery(client, data);

    const estimatedDuration = APPOINTMENT_DURATION[data.appointment_type];

    if (!estimatedDuration) {
      throw new Error("Invalid appointment type");
    }

    const result = insertAppointmentQuery(
      client,
      staffId,
      data,
      queueNumber,
      estimatedDuration,
    );

    await client.query("COMMIT");

    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const checkInAppointmentService = async (appointmentId) => {
  if (!appointmentId) {
    throw new Error("Appointment not found.");
  }

  const client = await pool.connect();

  try {
    client.query("BEGIN");

    const appointment = await checkInAppointmentQuery(client, appointmentId);

    if (!appointment) {
      throw new Error("Appointment not found or already checked in.");
    }

    await client.query("COMMIT");
    return appointment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const startAppointmentService = async (appointmentId) => {
  if (!appointmentId) {
    throw new Error("Appointment not found.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existAppointment = await checkAppointmentExistsQuery(
      client,
      appointmentId,
    );

    if (!existAppointment) {
      throw new Error("Appointment not found.");
    }
    if (existAppointment.status !== APPOINTMENT_STATUS.Checked_In) {
      throw new Error("Only CHECKED_IN appointments can be started");
    }

    const active = await checkDoctorInProgressQuery(client, existAppointment);

    if (active) {
      throw new Error("Doctor already has an active appointment");
    }

    const started = await startAppointmentQuery(client, appointmentId);

    await client.query("COMMIT");
    return started;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const CompleteAppointmentService = async (appointmentId) => {
  if (!appointmentId) {
    throw new Error("Appointment not found.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existAppointment = await checkAppointmentExistsQuery(
      client,
      appointmentId,
    );

    if (!existAppointment) {
      throw new Error("Appointment not found.");
    }
    if (existAppointment.status !== APPOINTMENT_STATUS.In_progress) {
      throw new Error("Only IN_PROGRESS appointments can be completed.");
    }

    if (!existAppointment.actual_start_time) {
      throw new Error("Appointment has no start time");
    }

    const completed = await completeAppointmentQuery(client, appointmentId);

    await client.query("COMMIT");
    return completed;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const cancelAppointmentService = async (
  appointmentId,
  staffId,
  data,
) => {
  if (!appointmentId) throw new Error("Appointment not found.");

  const { reason } = data;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existAppointment = await checkAppointmentExistsQuery(
      client,
      appointmentId,
    );

    if (!existAppointment) {
      throw new Error("Appointment not found.");
    }

    const status = existAppointment.status;
    if (
      ![APPOINTMENT_STATUS.Booked, APPOINTMENT_STATUS.Checked_In].includes(
        status,
      )
    ) {
      throw new Error(
        "Cannot cancel a completed or already cancelled appointment.",
      );
    }

    const cancelled = await cancelAppointmentQuery(
      client,
      appointmentId,
      staffId,
      reason,
    );

    await client.query("COMMIT");

    return cancelled;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const noShowAppointmentService = async (appointmentId) => {
  if (!appointmentId) throw new Error("Appointment not found.");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existAppointment = await checkAppointmentExistsQuery(
      client,
      appointmentId,
    );

    if (!existAppointment) {
      throw new Error("Appointment not found.");
    }

    const status = existAppointment.status;
    if (![APPOINTMENT_STATUS.Booked].includes(status)) {
      throw new Error(
        "Cannot mark no-show for completed or cancelled appointment.",
      );
    }

    const noShow = await noShowAppointmentQuery(client, appointmentId);

    await client.query("COMMIT");

    return noShow;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getLiveAppointmentService = async (
  doctorId,
  clinicId,
  departmentId,
) => {
  if (!clinicId || !departmentId) {
    throw new Error("Missing required parameters.");
  }

  const appointmentDate = new Date().toISOString().slice(0, 10);

  const appointments = await getLiveAppointmentQuery(
    doctorId,
    clinicId,
    departmentId,
    appointmentDate,
  );

  const appointmentsWithWaitingTime = [];

  for (const appt of appointments) {
    let prediction = null;

    if (
      appt.status === APPOINTMENT_STATUS.Checked_In ||
      appt.status === APPOINTMENT_STATUS.Booked
    ) {
      const result = await predictWaitTimeService({
        doctorId: appt.doctor_id,
        clinicId,
        departmentId,
        appointmentDate,
        appointmentType: appt.appointment_type,
        appointmentId: appt.id,
      });

      prediction = result;
    }

    appointmentsWithWaitingTime.push(
      mapAppointmentWithPrediction(appt, prediction),
    );
  }

  return appointmentsWithWaitingTime;
};

export const getAppointmentHistoryService = async ({
  date_from,
  date_to,
  doctor_id,
  clinic_id,
  department_id,
  appointment_type,
  patient_name,
  status,
  page,
  limit,
}) => {
  if (!date_from || !date_to) {
    throw new Error("Date range is required.");
  }
  const offset = (page - 1) * limit;
  const { rows, total } = await getAppointmentHistoryQuery({
    date_from,
    date_to,
    doctor_id,
    clinic_id,
    department_id,
    appointment_type,
    patient_name,
    status,
    page,
    limit,
    offset,
  });

  const mapped = rows.map(mapAppointmentHistory);

  return {
    data: mapped,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
};

export const updateAppointmentService = async (appointmentId, data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await checkAppointmentExistsQuery(client, appointmentId);

    if (!existing) {
      throw new Error("Appointment not found.");
    }

    // Ensure it's today's appointment
    const dateCheck = await client.query(
      `SELECT 1 
       FROM appointments 
       WHERE id = $1 
         AND appointment_date = CURRENT_DATE`,
      [appointmentId],
    );

    if (!dateCheck.rowCount) {
      throw new Error("Only today's appointments can be updated.");
    }

    // Only editable statuses
    if (
      existing.status !== APPOINTMENT_STATUS.Booked &&
      existing.status !== APPOINTMENT_STATUS.Checked_In
    ) {
      throw new Error(
        "Only BOOKED and CHECKED IN appointments can be updated.",
      );
    }

    const queueAffectingFieldsChanged =
      (data.doctor_id && data.doctor_id !== existing.doctor_id) ||
      (data.clinic_id && data.clinic_id !== existing.clinic_id) ||
      (data.department_id && data.department_id !== existing.department_id);

    if (queueAffectingFieldsChanged) {
      const newDoctorId = data.doctor_id || existing.doctor_id;
      const newClinicId = data.clinic_id || existing.clinic_id;
      const newDepartmentId = data.department_id || existing.department_id;

      const newQueueNumber = await getNextQueueNumberQuery(
        client,
        newDoctorId,
        existing.appointment_date,
        newClinicId,
        newDepartmentId,
      );

      data.queue_number = newQueueNumber;
    }

    const updated = await updateAppointmentQuery(client, appointmentId, data);

    await client.query("COMMIT");
    return updated;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getUpcomingAppointmentsService = async ({
  date_from,
  date_to,
  page,
  limit,
  status,
  clinic_id,
  department_id,
  doctor_id,
  appointment_type,
  patient_name,
}) => {
  if (!date_from || !date_to) {
    throw new Error("Date range is required");
  }
  if (!clinic_id) {
    throw new Error("Clinic is required");
  }

  const offset = (page - 1) * limit;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  if (date_from < todayStr) {
    throw new Error("Past date from is not valid");
  }

  const effectiveDateFrom =
    (status === APPOINTMENT_STATUS.Rejected ||
      status === APPOINTMENT_STATUS.Booked) &&
    date_from === todayStr
      ? tomorrowStr
      : date_from;

  const { rows, total } = await getUpcomingAppointmentsQuery({
    date_from: effectiveDateFrom,
    date_to,
    limit,
    offset,
    status,
    clinic_id,
    department_id,
    doctor_id,
    appointment_type,
    patient_name,
  });

  const mapped = rows.map(mapAppointmentHistory);

  return {
    data: mapped,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
};

export const approveAppointmentService = async (appointmentId, data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await checkAppointmentExistsQuery(client, appointmentId);

    if (!existing) {
      throw new Error("Appointment not found.");
    }

    if (existing.status !== APPOINTMENT_STATUS.Requested) {
      throw new Error("Only REQUESTED appointments can be approved.");
    }

    const doctorId = data.doctor_id || existing.doctor_id;
    const clinicId = data.clinic_id || existing.clinic_id;
    const departmentId = data.department_id || existing.department_id;
    const appointment_type = data.appointment_type || existing.appointment_type;

    if (!clinicId || !departmentId) {
      throw new Error("Clinic and department are required for approval.");
    }

    const queueNumber = await getNextQueueNumberQuery(
      client,
      doctorId,
      existing.appointment_date,
      clinicId,
      departmentId,
      appointment_type,
    );

    const estimatedDuration = APPOINTMENT_DURATION[data.appointment_type];
    if (!estimatedDuration) {
      throw new Error("Invalid appointment type");
    }
    const approved = await approveAppointmentQuery(client, appointmentId, {
      ...data,
      queue_number: queueNumber,
      status: APPOINTMENT_STATUS.Booked,
      estimated_duration: estimatedDuration,
    });

    await client.query("COMMIT");
    return approved;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const rejectAppointmentService = async (appointmentId, data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await checkAppointmentExistsQuery(client, appointmentId);

    if (!existing) {
      throw new Error("Appointment not found.");
    }

    if (existing.status !== APPOINTMENT_STATUS.Requested) {
      throw new Error("Only REQUESTED appointments can be rejected.");
    }

    const rejected = await rejectAppointmentQuery(client, appointmentId, {
      status: APPOINTMENT_STATUS.Rejected,
      cancelled_by: data.cancelled_by,
      cancellation_reason: data.cancellation_reason,
    });

    await client.query("COMMIT");
    return rejected;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// PATIENT
export const patientBookAppointmentService = async (patientId, dto) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!dto.clinic_id) throw new Error("Missing clinic fields");
    if (!dto.notes) throw new Error("Missing notes fields");
    if (!dto.preferred_date) throw new Error("Missing date fields");

    if (new Date(dto.preferred_date) < new Date().setHours(0, 0, 0, 0)) {
      throw new Error("Cannot book past dates");
    }

    const existing = await checkDuplicatePatientRequestQuery(
      client,
      patientId,
      dto.clinic_id,
      dto.preferred_date,
    );

    if (existing) {
      throw new Error(
        "You already have a pending or active appointment for this clinic on this date.",
      );
    }

    const result = await addPatientAppoinmentQuery(client, patientId, dto);

    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getPatientLiveAppointmentService = async (
  patientId,
  // clinicId,
  // departmentId,
) => {
  const appointmentDate = new Date().toISOString().slice(0, 10);

  const appointments = await getPatientLiveAppointmentQuery(
    patientId,
    // clinicId,
    // departmentId,
    appointmentDate,
  );

  const result = [];

  for (const appt of appointments) {
    let prediction = null;

    // Only predict when it actually makes sense
    if (
      appt.status === APPOINTMENT_STATUS.Booked ||
      appt.status === APPOINTMENT_STATUS.Checked_In
    ) {
      const predictionResult = await predictWaitTimeService({
        doctorId: appt.doctor_id,
        clinicId: appt.clinic_id,
        departmentId: appt.department_id,
        appointmentDate,
        appointmentType: appt.appointment_type,
        appointmentId: appt.id,
      });

      prediction = predictionResult;
    }

    result.push(mapPatientAppointmentWithPrediction(appt, prediction));
  }

  return result;
};

export const getPatientAppointmentHistoryService = async ({
  patient_id,
  date_from,
  date_to,
  status,
  page,
  limit,
}) => {
  if (!date_from || !date_to) {
    throw new Error("Date range is required.");
  }

  const offset = (page - 1) * limit;

  const { rows, total } = await getPatientAppointmentHistoryQuery({
    patient_id,
    date_from,
    date_to,
    status,
    limit,
    offset,
  });

  const mapped = rows.map(mapAppointmentHistory);

  return {
    data: mapped,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
};

export const getPatientPendingAppointmentsService = async ({
  patient_id,
  status,
}) => {
  if (!patient_id) {
    throw new Error("Patient is required");
  }

  const { rows } = await getPatientPendingAppointmentsQuery({
    patient_id,
    status,
  });

  const mapped = rows.map(mapAppointmentHistory);

  return mapped;
};
