import {
  CancelAPpointmentDto,
  StaffAppointmentDto,
} from "../dto/appointmentDto.js";
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

    return sendResponse(res, 200, "Appointment updated successfully.", result.id);
  } catch (error) {
    console.error("error updating appointment.", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
