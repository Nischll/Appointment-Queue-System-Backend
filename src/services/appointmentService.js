import pool from "../config/db.js";
import APPOINTMENT_STATUS from "../enums/appointmentStatus.enum.js";
import {
  assignQueueNumberQuery,
  cancelAppointmentQuery,
  checkAppointmentExistsQuery,
  checkDoctorInProgressQuery,
  checkDuplicateAppointmentQuery,
  checkInAppointmentQuery,
  completeAppointmentQuery,
  insertAppointmentQuery,
  noShowAppointmentQuery,
  startAppointmentQuery,
} from "../models/appointmentModel.js";

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
        "Patient already has an active appointment with this doctor on this date"
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
      estimatedDuration
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
      appointmentId
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
      appointmentId
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
  data
) => {
  if (!appointmentId) throw new Error("Appointment not found.");

  const { reason } = data;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existAppointment = await checkAppointmentExistsQuery(
      client,
      appointmentId
    );

    if (!existAppointment) {
      throw new Error("Appointment not found.");
    }

    const status = existAppointment.status;
    if (
      ![APPOINTMENT_STATUS.Booked, APPOINTMENT_STATUS.Checked_In].includes(
        status
      )
    ) {
      throw new Error(
        "Cannot cancel a completed or already cancelled appointment."
      );
    }

    const cancelled = await cancelAppointmentQuery(
      client,
      appointmentId,
      staffId,
      reason
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
      appointmentId
    );

    if (!existAppointment) {
      throw new Error("Appointment not found.");
    }

    const status = existAppointment.status;
    if (![APPOINTMENT_STATUS.Booked].includes(status)) {
      throw new Error(
        "Cannot mark no-show for completed or cancelled appointment."
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
