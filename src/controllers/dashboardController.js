import {
  getAppointmentCountByStatusService,
  getSummaryService,
  getAppointmentTypesService,
  getAppointmentsChartService,
  getDoctorsAtWorkService,
  getApprovalRequestsService,
} from "../services/dashboardService.js";
import { sendResponse } from "../utils/response.js";

export const getAppointmentCountByStatus = async (req, res) => {
  try {
    const { clinic_id } = req.query;
    const data = await getAppointmentCountByStatusService(parseInt(clinic_id));
    return sendResponse(res, 200, "Dashboard data fetched", data);
  } catch (error) {
    console.error("dashboard error", error);
    return sendResponse(res, 500, error.message, null);
  }
};

export const getSummary = async (req, res) => {
  try {
    const { timeframe, clinic_id } = req.query;
    const clinicId = clinic_id ? parseInt(clinic_id, 10) : null;
    const data = await getSummaryService(timeframe, clinicId);
    return sendResponse(res, 200, "OK", data);
  } catch (error) {
    console.error("dashboard summary error", error);
    return sendResponse(res, 500, error.message, null);
  }
};

export const getAppointmentTypes = async (req, res) => {
  try {
    const { timeframe, clinic_id } = req.query;
    const clinicId = clinic_id ? parseInt(clinic_id, 10) : null;
    const data = await getAppointmentTypesService(timeframe, clinicId);
    return sendResponse(res, 200, "OK", data);
  } catch (error) {
    console.error("dashboard appointment-types error", error);
    return sendResponse(res, 500, error.message, null);
  }
};

export const getAppointmentsChart = async (req, res) => {
  try {
    const { timeframe, clinic_id } = req.query;
    const clinicId = clinic_id ? parseInt(clinic_id, 10) : null;
    const data = await getAppointmentsChartService(timeframe, clinicId);
    return sendResponse(res, 200, "OK", data);
  } catch (error) {
    console.error("dashboard appointments-chart error", error);
    return sendResponse(res, 500, error.message, null);
  }
};

export const getDoctorsAtWork = async (req, res) => {
  try {
    const { clinic_id } = req.query;
    const clinicId = clinic_id ? parseInt(clinic_id, 10) : null;
    const data = await getDoctorsAtWorkService(clinicId);
    return sendResponse(res, 200, "OK", data);
  } catch (error) {
    console.error("dashboard doctors-at-work error", error);
    return sendResponse(res, 500, error.message, null);
  }
};

export const getApprovalRequests = async (req, res) => {
  try {
    const { clinic_id } = req.query;
    const clinicId = clinic_id ? parseInt(clinic_id, 10) : null;
    const data = await getApprovalRequestsService(clinicId);
    return sendResponse(res, 200, "OK", data);
  } catch (error) {
    console.error("dashboard approval-requests error", error);
    return sendResponse(res, 500, error.message, null);
  }
};
