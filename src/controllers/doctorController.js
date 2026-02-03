import { DoctorDto } from "../dto/doctorDto.js";
import { formatTimeToAMPM } from "../helper/formatTimeToAMPM.js";
import {
  createDoctorService,
  getDoctorsByDepartmentService,
  getPatientDoctorsService,
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
      null,
    );
  }
};

export const getDoctors = async (req, res) => {
  try {
    const departmentId = req.query.departmentId;
    const data = await getDoctorsByDepartmentService(departmentId);
    const formatted = data.map((d) => ({
      ...d,
      today_start_time: formatTimeToAMPM(d.today_start_time),
      today_end_time: formatTimeToAMPM(d.today_end_time),
    }));
    return sendResponse(res, 200, "Successfully retrieved doctors.", formatted);
  } catch (error) {
    console.error("error fetching doctors", error);
    return sendResponse(
      res,
      error.message.includes("exists") ? 400 : 500,
      error.message,
      null,
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
      null,
    );
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const { doctorId, departmentId } = req.params;

    const data = await removeDoctorFromDepartmentService(
      doctorId,
      departmentId,
    );

    return sendResponse(
      res,
      200,
      "Doctor removed successfully",
      data.doctor_id,
    );
  } catch (error) {
    console.error("error removing doctor", error);
    return sendResponse(
      res,
      error.message.includes("not found") ? 404 : 500,
      error.message,
      null,
    );
  }
};

// PATIENT
export const getPatientDoctors = async (req, res) => {
  try {
    const { clinicId, date } = req.query;

    const data = await getPatientDoctorsService({
      clinicId,
      date,
    });

    const formatted = data.map((d) => ({
      ...d,
      start_time: formatTimeToAMPM(d.start_time),
      end_time: formatTimeToAMPM(d.end_time),
    }));

    return sendResponse(res, 200, "Doctors fetched successfully", formatted);
  } catch (error) {
    return sendResponse(res, 400, error.message, null);
  }
};
