import { predictWaitTimeService } from "../services/predictWaitTimeService.js";
import { sendResponse } from "../utils/response.js";

export const predictWaitTime = async (req, res) => {
  try {
    const {
      doctor_id,
      clinic_id,
      department_id,
      appointment_date,
      appointment_type,
      appointment_id,
    } = req.query;
    const prediction = await predictWaitTimeService({
      doctorId: parseInt(doctor_id),
      clinicId: parseInt(clinic_id),
      departmentId: parseInt(department_id),
      appointmentDate: appointment_date,
      appointmentType: appointment_type,
      appointmentId: appointment_id ? parseInt(appointment_id) : null,
    });

    return sendResponse(
      res,
      200,
      "Predicted waiting time calculated",
      prediction,
    );
  } catch (error) {
    console.log("Prediction error:", error);
    return sendResponse(res, 500, error.message, null);
  }
};
