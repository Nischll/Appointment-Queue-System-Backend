import { getAppointmentQueueService } from "../services/appointmentQueueService.js";
import { sendResponse } from "../utils/response.js";

export const getAppointmentQueue = async (req, res) => {
  try {
    const {
      doctor_id,
      clinic_id,
      department_id,
      appointment_date,
      appointment_id,
    } = req.query;
    const queue = await getAppointmentQueueService(
      parseInt(doctor_id),
      parseInt(clinic_id),
      parseInt(department_id),
      appointment_date,
      appointment_id ? parseInt(appointment_id) : null,
    );

    return sendResponse(res, 200, "Queue fetched successfully", queue);
  } catch (error) {
    console.log("Error fetching queue:", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
