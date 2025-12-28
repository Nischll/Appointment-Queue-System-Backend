import { DoctorShiftDto } from "../dto/doctorShiftDto.js";
import { formatTimeToAMPM } from "../helper/formatTimeToAMPM.js";
import {
  getDoctorShiftsService,
  updateDoctorShiftService,
} from "../services/doctorShiftService.js";
import { sendResponse } from "../utils/response.js";

export const updateDoctorShifts = async (req, res) => {
  try {
    const { doctorId, departmentId } = req.params;
    const { shifts } = req.body;
    const shiftDtos = shifts.map((s) => new DoctorShiftDto(s));
    await updateDoctorShiftService(doctorId, departmentId, shiftDtos);
    return sendResponse(res, 200, "Doctor shifts updated successfully", null);
  } catch (error) {
    console.log("error updating shifts", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};

export const getDoctorShifts = async (req, res) => {
  try {
    const { doctorId, departmentId } = req.params;

    const data = await getDoctorShiftsService(doctorId, departmentId);
    const formatted = data.map((d) => ({
      ...d,
      start_time: formatTimeToAMPM(d.start_time),
      end_time: formatTimeToAMPM(d.end_time),
    }));
    return sendResponse(
      res,
      200,
      "Doctor shifts fetched successfully",
      formatted
    );
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
