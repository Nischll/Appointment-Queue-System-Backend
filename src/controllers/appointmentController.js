import {
  CancelAPpointmentDto,
  StaffAppointmentDto,
} from "../dto/appointmentDto.js";
import {
  cancelAppointmentService,
  checkInAppointmentService,
  CompleteAppointmentService,
  noShowAppointmentService,
  staffBookAppointmentService,
  startAppointmentService,
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
      data.id
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
