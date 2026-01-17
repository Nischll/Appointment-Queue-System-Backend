import { getAppointmentMetricsService } from "../services/appointmentMetricsService.js";
import { sendResponse } from "../utils/response.js";

export const getAppointmentMetrics = async (req, res) => {
  try {
    const { doctor_id, clinic_id, department_id, appointment_type } = req.query;

    const metrics = await getAppointmentMetricsService(
      parseInt(doctor_id),
      parseInt(clinic_id),
      parseInt(department_id),
      appointment_type
    );

    return sendResponse(res, 200, "Metrics fetched successfully", metrics);
  } catch (error) {
    console.log("Error fetching metrics:", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};