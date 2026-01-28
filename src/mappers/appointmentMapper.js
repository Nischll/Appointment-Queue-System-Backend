import APPOINTMENT_STATUS from "../enums/appointmentStatus.enum.js";
import { formatTimeToAMPM } from "../helper/formatTimeToAMPM.js";

export const mapAppointmentWithPrediction = (appt, prediction) => {
  return {
    appointment: {
      id: appt.id,
      patient_id: appt.patient_id,
      patient_name: appt.patient_name,
      queue_number: appt.queue_number,
      status: appt.status,
      notes: appt.notes,
      created_by: appt.created_by,
      appointment_created_by: appt.appointment_created_by,
      cancelled_by: appt.cancelled_by,
      appointment_cancelled_by: appt.appointment_cancelled_by,
      cancellation_reason: appt.cancellation_reason,
      appointment_type: appt.appointment_type,
      appointment_date: appt.appointment_date,
      scheduled_start_time: formatTimeToAMPM(appt.scheduled_start_time),
      is_walk_in: appt.is_walk_in,
      checked_in_time: formatTimeToAMPM(appt.checked_in_time),
      actual_start_time: formatTimeToAMPM(appt.actual_start_time),
      actual_end_time: formatTimeToAMPM(appt.actual_end_time),
    },

    prediction:
      appt.status === APPOINTMENT_STATUS.In_progress
        ? {
            predicted_wait_minutes: 0,
            confidence: "HIGH",
            my_position: 0,
            explanation: null,
          }
        : prediction
          ? {
              predicted_wait_minutes: prediction.predicted_wait_minutes,
              confidence: prediction.confidence,
              my_position: prediction.my_position,
              explanation: prediction.explanation,
            }
          : null,
  };
};

export const mapAppointmentHistory = (appt) => {
  return {
    id: appt.id,
    patient_id: appt.patient_id,
    patient_name: appt.patient_name,

    clinic_id: appt.clinic_id,
    clinic_name: appt.clinic_name,

    department_id: appt.department_id,
    department_name: appt.department_name,

    doctor_id: appt.doctor_id,
    doctor_name: appt.doctor_name,

    queue_number: appt.queue_number,
    status: appt.status,
    notes: appt.notes,

    appointment_created_by_id: appt.created_by,
    appointment_created_by_name: appt.created_by_name,

    cancelled_by_id: appt.cancelled_by,
    cancelled_by_name: appt.cancelled_by_name,

    cancellation_reason: appt.cancellation_reason,
    appointment_type: appt.appointment_type,
    appointment_date: appt.appointment_date,

    preferred_time: appt.preferred_time,
    scheduled_start_time: formatTimeToAMPM(appt.scheduled_start_time),
    checked_in_time: formatTimeToAMPM(appt.checked_in_time),
    actual_start_time: formatTimeToAMPM(appt.actual_start_time),
    actual_end_time: formatTimeToAMPM(appt.actual_end_time),

    is_walk_in: appt.is_walk_in,
  };
};

// PATIENT
export const mapPatientAppointmentWithPrediction = (appt, prediction) => {
  const isQueued =
    appt.status === APPOINTMENT_STATUS.Booked ||
    appt.status === APPOINTMENT_STATUS.Checked_In ||
    appt.status === APPOINTMENT_STATUS.In_progress;

  return {
    appointment: {
      id: appt.id,
      // patient_id: appt.patient_id,
      patient_name: appt.patient_name,

      // clinic_id: appt.clinic_id,
      clinic_name: appt.clinic_name,
      clinic_address: appt.clinic_address,

      // department_id: appt.department_id,
      department_name: appt.department_name,

      // doctor_id: appt.doctor_id,
      doctor_name: appt.doctor_name,

      queue_number: appt.queue_number,
      status: appt.status,
      appointment_type: appt.appointment_type,
      notes: appt.notes,

      appointment_date: appt.appointment_date,
      scheduled_start_time: formatTimeToAMPM(appt.scheduled_start_time),

      is_walk_in: appt.is_walk_in,
      checked_in_time: formatTimeToAMPM(appt.checked_in_time),
      actual_start_time: formatTimeToAMPM(appt.actual_start_time),
      actual_end_time: formatTimeToAMPM(appt.actual_end_time),

      // approved_by: appt.approved_by,
      appointment_approved_by: appt.appointment_approved_by,
      cancelled_by: appt.cancelled_by,
      appointment_cancelled_by: appt.appointment_cancelled_by,
      cancellation_reason: appt.cancellation_reason,
    },

    // ---------------- Prediction Block ----------------
    prediction: isQueued
      ? appt.status === APPOINTMENT_STATUS.In_progress
        ? {
            predicted_wait_minutes: 0,
            my_position: 0,
            confidence: "HIGH",
            explanation: { reason: "Currently in progress" },
          }
        : prediction
          ? {
              predicted_wait_minutes: prediction.predicted_wait_minutes,
              my_position: prediction.my_position,
              confidence: prediction.confidence,
              explanation: prediction.explanation,
            }
          : null
      : null, // REQUESTED → no prediction at all
  };
};
