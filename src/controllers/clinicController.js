import { ClinicDto } from "../dto/clinicDto.js";
import {
  createClinicService,
  getAllClinicService,
} from "../services/clinicService.js";
import { sendResponse } from "../utils/response.js";

export const createClinic = async (req, res) => {
  try {
    const dto = new ClinicDto(req.body);
    const data = await createClinicService(dto);
    return sendResponse(res, 200, "Clinic added successfully", data);
  } catch (error) {
    return sendResponse(res, 400, error.message, null);
  }
};

export const getClinics = async (req, res) => {
  try {
    const data = await getAllClinicService();
    return sendResponse(res, 200, "Successfully retrieved clinics", data);
  } catch (error) {
    console.error("error getting clinics", error);
    return sendResponse(res, 500, error.message, null);
  }
};
