import { ClinicDto } from "../dto/clinicDto.js";
import {
  createClinicService,
  deleteClinicService,
  getAllClinicService,
  updateClinicService,
} from "../services/clinicService.js";
import { sendResponse } from "../utils/response.js";

export const createClinic = async (req, res) => {
  try {
    const dto = new ClinicDto(req.body);
    const data = await createClinicService(dto);
    return sendResponse(res, 200, "Clinic added successfully", data);
  } catch (error) {
    console.error("error posting clinics", error);
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

export const updateClinic = async (req, res) => {
  try {
    const clinicId = req.params.id;
    const clinicDto = new ClinicDto(req.body);
    if (!clinicDto.name) {
      return sendResponse(res, 400, "clinic name is required.", null);
    }

    const data = await updateClinicService(clinicId, clinicDto);

    return sendResponse(res, 200, "Clinic updated successfully.", data);
  } catch (error) {
    console.error("error updating clinics", error);
    return sendResponse(res, 500, error.message, null);
  }
};

export const deleteClinic = async (req, res) => {
  try {
    const clinicId = req.params.id;
    const data = await deleteClinicService(clinicId);

    return sendResponse(res, 200, "clinic removed successfully.", data);
  } catch (error) {
    console.error("error deleting clinic.", error);
    return sendResponse(res, 500, error.message, null);
  }
};
