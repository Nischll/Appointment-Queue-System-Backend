import { SignupDto } from "../dto/signupDto.js";
import {
  createPatientService,
  deletePatientService,
  getAllPatientService,
  getPatientByIdService,
  updatePatientService,
} from "../services/patientService.js";
import { sendResponse } from "../utils/response.js";

export const createPatient = async (req, res) => {
  try {
    const dto = new SignupDto(req.body);
    const data = await createPatientService(dto);
    return sendResponse(res, 200, "Patient created successfully", data);
  } catch (error) {
    console.error("error creating patient", error);
    return sendResponse(res, 400, error.message, null);
  }
};

export const getAllPatient = async (req, res) => {
  try {
    const data = await getAllPatientService();
    return sendResponse(res, 200, "Patient fetched successfully", data);
  } catch (error) {
    console.log("error getting patients", error);
    return sendResponse(
      res,
      error.statusCode || 500,
      "Failed to fetch patients",
      null
    );
  }
};

export const getPatientById = async (req, res) => {
  try {
    const patientId = req.params.id;
    const data = await getPatientByIdService(patientId);
    return sendResponse(res, 200, "Patient fetched successfully", data);
  } catch (error) {
    console.log("error getting patients", error);
    return sendResponse(
      res,
      error.statusCode || 500,
      "Failed to fetch patients",
      null
    );
  }
};

export const deletePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const data = await deletePatientService(patientId);
    return sendResponse(res, 200, "Patient removed successfully", data.id);
  } catch (error) {
    console.log("error removing patients", error);
    return sendResponse(
      res,
      error.statusCode || 500,
      "Failed to remove patients",
      null
    );
  }
};

export const updatePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const dto = new SignupDto(req.body);
    const data = await updatePatientService(patientId, dto);
    return sendResponse(
      res,
      200,
      "Patient updated successfully.",
      data.user_id
    );
  } catch (error) {
    console.log("error updating patient details", error);
    return sendResponse(res, error.statusCode || 500, error.message, null);
  }
};
