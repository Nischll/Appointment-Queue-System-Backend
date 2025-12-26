import {
  getDoctorShiftsService,
  updateDoctorShiftService,
} from "../services/doctorShiftService.js";
import { sendResponse } from "../utils/response.js";

export const updateDoctorShifts = async (req, res) => {
  try {
    const { doctorId, clinicId } = req.params;
    const { shifts } = req.body;

    await updateDoctorShiftService(doctorId, clinicId, shifts);
    return sendResponse(res, 200, "Doctor shifts updated successfully", null);
  } catch (error) {
    console.log("error updating shifts", error);
    return sendResponse(
      res,
      error.statusCode || 500,
      error.message,
      null
    );
  }
};

export const getDoctorShifts = async (req, res) => {
  try {
    const { doctorId, clinicId } = req.params;

    const data = await getDoctorShiftsService(doctorId, clinicId);
    return sendResponse(res, 200, "Doctor shifts fetched successfully", data);
  } catch (error) {
    console.log("error getting shifts", error);
    return sendResponse(
      res,
      error.statusCode || 500,
      "failed to fetch shifts",
      null
    );
  }
};
