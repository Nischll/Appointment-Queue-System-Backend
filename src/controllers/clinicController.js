import { ClinicDto } from "../dto/clinicDto.js";
import { clinicService } from "../services/clinicService.js";
import { sendResponse } from "../utils/response.js";

export const createClinic = async (req, res) => {
  try {
    const dto = new ClinicDto(req.body);
    const data = await clinicService(dto);
    return sendResponse(res, 200, "Clinic added successfully", data);
  } catch (error) {
    return sendResponse(res, 400, error.message, null);
  }
};
