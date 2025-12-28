import { DoctorDto } from "../dto/doctorDto.js";
import {
  createDoctorService,
  getDoctorsByDepartmentService,
  removeDoctorFromDepartmentService,
  updateDoctorService,
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
    const departmentId = req.query.departmentId;
    const data = await getDoctorsByDepartmentService(departmentId);
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

export const updateDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctorDto = new DoctorDto(req.body);
    const data = await updateDoctorService(doctorId, doctorDto);

    return sendResponse(res, 200, "Doctor updated successfully.", data.id);
  } catch (error) {
    console.error("error updating doctor", error);
    return sendResponse(
      res,
      error.message.includes("belongs") ? 400 : 500,
      error.message,
      null
    );
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const { doctorId, departmentId } = req.params;

    const data = await removeDoctorFromDepartmentService(doctorId, departmentId);

    return sendResponse(
      res,
      200,
      "Doctor removed successfully",
      data.doctor_id
    );
  } catch (error) {
    console.error("error removing doctor", error);
    return sendResponse(
      res,
      error.message.includes("not found") ? 404 : 500,
      error.message,
      null
    );
  }
};
