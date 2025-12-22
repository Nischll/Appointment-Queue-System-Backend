import { DoctorDto } from "../dto/doctorDto.js";
import {
  createDoctorService,
  getDoctorByClinic,
} from "../services/doctorService.js";
import { sendResponse } from "../utils/response.js";

export const createDoctor = async (req, res) => {
  try {
    const dto = new DoctorDto(req.body);
    const data = await createDoctorService(dto);
    return sendResponse(res, 200, "Doctor added successfully", data);
  } catch (error) {
    console.error("error creating doctor", error);
    return sendResponse(
      res,
      error.message.includes("exists") ? 400 : 500,
      error.message,
      null
    );
  }
};

export const getDoctors = async (req, res) => {
  try {
    const clinicId = req.query.clinicId;
    const data = await getDoctorByClinic(clinicId);
    return sendResponse(res, 200, "Successfully retrieved doctors.", data);
  } catch (error) {
    console.error("error fetching doctors", error);
    return sendResponse(
      res,
      error.message.includes("exists") ? 400 : 500,
      error.message,
      null
    );
  }
};
