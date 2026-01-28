import {
  CancelAPpointmentDto,
  StaffAppointmentDto,
} from "../dto/appointmentDto.js";
import { PatientAppointmentDto } from "../dto/patientAppointmentDto.js";
import {
  cancelAppointmentService,
  checkInAppointmentService,
  CompleteAppointmentService,
  getLiveAppointmentService,
  noShowAppointmentService,
  staffBookAppointmentService,
  startAppointmentService,
  getAppointmentHistoryService,
  updateAppointmentService,
  patientBookAppointmentService,
  getPatientLiveAppointmentService,
  getPatientAppointmentHistoryService,
  getPendingAppointmentsService,
  approveAppointmentService,
  rejectAppointmentService,
} from "../services/appointmentService.js";
import { sendResponse } from "../utils/response.js";

export const staffBookAppointment = async (req, res) => {
  try {
    const staffId = req.user.id;
    const dto = new StaffAppointmentDto(req.body);
    const data = await staffBookAppointmentService(staffId, dto);
    return sendResponse(res, 200, "Appointment booked successfully", data.id);
  } catch (error) {
    console.log("error adding appointment", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

export const checkInAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const data = await checkInAppointmentService(appointmentId);
    return sendResponse(res, 200, "Patient checked in successfully.", data.id);
  } catch (error) {
    console.log("error while checking in.", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

export const startAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const data = await startAppointmentService(appointmentId);
    return sendResponse(res, 200, "Appointment started successfully", data.id);
  } catch (error) {
    console.log("error while starting appointment.", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

export const completeAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const data = await CompleteAppointmentService(appointmentId);
    return sendResponse(
      res,
      200,
      "Appointment completed successfully",
      data.id,
    );
  } catch (error) {
    console.log("error while completing appointment.", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const staffId = req.user.id;
    const appointmentId = req.params.id;
    const dto = new CancelAPpointmentDto(req.body);
    const data = await cancelAppointmentService(appointmentId, staffId, dto);
    return sendResponse(res, 200, "Appointment cancelled.", data.id);
  } catch (error) {
    console.log("error cancelling appointment.", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

export const noShowAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const data = await noShowAppointmentService(appointmentId);
    return sendResponse(res, 200, "Appointment marked as no-show.", data.id);
  } catch (error) {
    console.log("error marking no-show appointment.", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

export const todayAppointmentsWithWaitingTime = async (req, res) => {
  try {
    const { doctor_id, clinic_id, department_id } = req.query;

    const data = await getLiveAppointmentService(
      parseInt(doctor_id),
      parseInt(clinic_id),
      parseInt(department_id),
    );
    return sendResponse(
      res,
      200,
      "Appointments fetched with waiting time",
      data,
    );
  } catch (error) {
    console.log("error fetching appointments.", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

export const getAppointmentHistory = async (req, res) => {
  try {
    const {
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
    } = req.query;

    const data = await getAppointmentHistoryService({
      date_from,
      date_to,
      doctor_id: doctor_id ? parseInt(doctor_id) : null,
      clinic_id: clinic_id ? parseInt(clinic_id) : null,
      department_id: department_id ? parseInt(department_id) : null,
      appointment_type: appointment_type || null,
      patient_name: patient_name || null,
      status: status || null,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return sendResponse(res, 200, "Appointments fetched successfully.", data);
  } catch (error) {
    console.log("error fetching appointments.", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.id, 10);

    const data = {
      patient_id: req.body.patient_id,
      doctor_id: req.body.doctor_id,
      clinic_id: req.body.clinic_id,
      department_id: req.body.department_id,
      appointment_type: req.body.appointment_type,
      scheduled_start_time: req.body.scheduled_start_time,
      // estimated_duration: req.body.estimated_duration,
      notes: req.body.notes,
      is_walk_in: req.body.is_walk_in,
    };

    const result = await updateAppointmentService(appointmentId, data);

    return sendResponse(
      res,
      200,
      "Appointment updated successfully.",
      result.id,
    );
  } catch (error) {
    console.error("error updating appointment.", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

export const getPendingAppointments = async (req, res) => {
  try {
    const {
      clinic_id,
      department_id,
      doctor_id,
      appointment_type,
      patient_name,
      date_from,
      date_to,
      page = 1,
      limit = 10,
    } = req.query;

    const data = await getPendingAppointmentsService({
      clinic_id: parseInt(clinic_id),
      department_id: department_id ? parseInt(department_id) : null,
      doctor_id: doctor_id ? parseInt(doctor_id) : null,
      appointment_type: appointment_type || null,
      patient_name: patient_name || null,
      date_from,
      date_to,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return sendResponse(
      res,
      200,
      "Pending appointments fetched successfully.",
      data,
    );
  } catch (error) {
    console.log("error fetching pending appointments.", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

export const approveAppointment = async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.id, 10);
    const approvedBy = req.user.id;

    const data = {
      doctor_id: req.body.doctor_id,
      clinic_id: req.body.clinic_id,
      department_id: req.body.department_id,
      appointment_type: req.body.appointment_type,
      scheduled_start_time: req.body.scheduled_start_time,
      notes: req.body.notes,
      approved_by: approvedBy,
    };

    const result = await approveAppointmentService(appointmentId, data);

    return sendResponse(
      res,
      200,
      "Appointment approved successfully.",
      result.id,
    );
  } catch (error) {
    console.error("error approving appointment.", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

export const rejectAppointment = async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.id, 10);
    const rejectedBy = req.user.id;
    const { cancellation_reason } = req.body;

    if (!cancellation_reason) {
      return sendResponse(res, 400, "Cancellation reason is required.", null);
    }

    const result = await rejectAppointmentService(appointmentId, {
      cancelled_by: rejectedBy,
      cancellation_reason,
    });

    return sendResponse(
      res,
      200,
      "Appointment rejected successfully.",
      result.id,
    );
  } catch (error) {
    console.error("error rejecting appointment.", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

// PATIENT
export const patientBookAppointment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const dto = new PatientAppointmentDto(req.body);

    const data = await patientBookAppointmentService(patientId, dto);

    return sendResponse(
      res,
      200,
      "Appointment request submitted. Awaiting approval.",
      data.id,
    );
  } catch (error) {
    console.log("error patient booking", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

export const getPatientLiveAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;
    // const { clinic_id, department_id } = req.query;

    const data = await getPatientLiveAppointmentService(
      patientId,
      // parseInt(clinic_id),
      // department_id ? parseInt(department_id) : null,
    );

    return sendResponse(
      res,
      200,
      "Patient live appointments fetched successfully",
      data,
    );
  } catch (error) {
    console.log("error fetching patient live appointments.", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

export const getPatientAppointmentHistory = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { date_from, date_to, status, page, limit } = req.query;

    const data = await getPatientAppointmentHistoryService({
      patient_id: patientId,
      date_from,
      date_to,
      status: status || null,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return sendResponse(
      res,
      200,
      "Appointment history fetched successfully.",
      data,
    );
  } catch (error) {
    console.log("error fetching patient history.", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
