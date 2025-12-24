import { updateDoctorService } from "../services/doctorService";
import { sendResponse } from "../utils/response.js";

export const updateDoctorShifts = async (req, res) => {
  try {
    const { doctorId, clinicId } = req.params;
    const { shifts } = req.body;

    await updateDoctorService(doctorId, clinicId, shifts);
    return sendResponse(res, 200, "Doctor shifts updated successfully", null);
  } catch (error) {
    console.log("error updating shifts", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
