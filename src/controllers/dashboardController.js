import {
  getAppointmentCountByStatusService,
  getSummaryService,
  getAppointmentTypesService,
  getAppointmentsChartService,
  getDoctorsAtWorkService,
  getApprovalRequestsService,
} from "../services/dashboardService.js";
import { sendResponse } from "../utils/response.js";

/** Parse clinic id from query (supports both clinic_id and clinicId). */
const getClinicIdFromQuery = (query) => {
  const raw = query.clinic_id ?? query.clinicId;
  if (raw == null || raw === "") return null;
  const id = parseInt(raw, 10);
  return Number.isNaN(id) ? null : id;
};

export const getAppointmentCountByStatus = async (req, res) => {
  try {
    const clinicId = getClinicIdFromQuery(req.query);
    const data = await getAppointmentCountByStatusService(clinicId);
    return sendResponse(res, 200, "Dashboard data fetched", data);
  } catch (error) {
    console.error("dashboard error", error);
    return sendResponse(res, 500, error.message, null);
  }
};

export const getSummary = async (req, res) => {
  try {
    const { timeframe } = req.query;
    const clinicId = getClinicIdFromQuery(req.query);
    const data = await getSummaryService(timeframe, clinicId);
    return sendResponse(res, 200, "OK", data);
  } catch (error) {
    console.error("dashboard summary error", error);
    return sendResponse(res, 500, error.message, null);
  }
};

export const getAppointmentTypes = async (req, res) => {
  try {
    const { timeframe } = req.query;
    const clinicId = getClinicIdFromQuery(req.query);
    const data = await getAppointmentTypesService(timeframe, clinicId);
    return sendResponse(res, 200, "OK", data);
  } catch (error) {
    console.error("dashboard appointment-types error", error);
    return sendResponse(res, 500, error.message, null);
  }
};

export const getAppointmentsChart = async (req, res) => {
  try {
    const { timeframe } = req.query;
    const clinicId = getClinicIdFromQuery(req.query);
    const data = await getAppointmentsChartService(timeframe, clinicId);
    return sendResponse(res, 200, "OK", data);
  } catch (error) {
    console.error("dashboard appointments-chart error", error);
    return sendResponse(res, 500, error.message, null);
  }
};

export const getDoctorsAtWork = async (req, res) => {
  try {
    const clinicId = getClinicIdFromQuery(req.query);
    const data = await getDoctorsAtWorkService(clinicId);
    return sendResponse(res, 200, "OK", data);
  } catch (error) {
    console.error("dashboard doctors-at-work error", error);
    return sendResponse(res, 500, error.message, null);
  }
};

export const getApprovalRequests = async (req, res) => {
  try {
    const clinicId = getClinicIdFromQuery(req.query);
    const data = await getApprovalRequestsService(clinicId);
    return sendResponse(res, 200, "OK", data);
  } catch (error) {
    console.error("dashboard approval-requests error", error);
    return sendResponse(res, 500, error.message, null);
  }
};
