import { DepartmentDto } from "../dto/departmentDto.js";
import {
  createDepartmentService,
  deleteDepartmentService,
  getDepartmentByClinicService,
  updateDepartmentService,
} from "../services/departmentService.js";
import { sendResponse } from "../utils/response.js";

export const createDepartment = async (req, res) => {
  try {
    const dto = new DepartmentDto(req.body);
    const data = await createDepartmentService(dto);
    return sendResponse(res, 200, "Department added successfully.", data.id);
  } catch (error) {
    console.log("error creating department.", error.message);
    return sendResponse(
      res,
      error.message.includes("exists") ? 400 : 500,
      error.message,
      null
    );
  }
};

export const getDepartments = async (req, res) => {
  try {
    const clinicId = req.query.clinicId;
    const data = await getDepartmentByClinicService(Number(clinicId));
    return sendResponse(res, 200, "Departments fetched successfully.", data);
  } catch (error) {
    console.log("error fetching department.", error.message);
    return sendResponse(
      res,
      error.message.includes("exists") ? 400 : 500,
      error.message,
      null
    );
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;
    const dto = new DepartmentDto(req.body);
    const data = await updateDepartmentService(Number(departmentId), dto);
    return sendResponse(res, 200, "Department updated successfully.", data.id);
  } catch (error) {
    console.error("error updating department", error);
    return sendResponse(
      res,
      error.message.includes("belongs") ? 400 : 500,
      error.message,
      null
    );
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;
    const data = await deleteDepartmentService(Number(departmentId));
    return sendResponse(res, 200, "Department removed successfully.", data.id);
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
