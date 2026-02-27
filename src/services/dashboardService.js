import {
  getAppointmentCountByStatusQuery,
  getTimeframeBounds,
  isValidTimeframe,
  getSummaryDataQuery,
  getAppointmentTypesByRangeQuery,
  getAppointmentsChartQuery,
  getDoctorsAtWorkQuery,
  getApprovalRequestsQuery,
  APPOINTMENT_TYPE_LABELS,
} from "../models/dashboardModel.js";

export const getAppointmentCountByStatusService = async (clinicId) => {
  if (!clinicId) {
    throw new Error("Clinic not found");
  }
  const result = await getAppointmentCountByStatusQuery(clinicId);
  return result;
};

export const getSummaryService = async (timeframe, clinicId = null) => {
  if (!isValidTimeframe(timeframe)) {
    throw new Error(`Invalid timeframe. Use one of: daily, weekly, monthly, yearly`);
  }
  return getSummaryDataQuery(timeframe, clinicId);
};

export const getAppointmentTypesService = async (timeframe, clinicId = null) => {
  if (!isValidTimeframe(timeframe)) {
    throw new Error(`Invalid timeframe. Use one of: daily, weekly, monthly, yearly`);
  }
  const { start, end } = getTimeframeBounds(timeframe);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  const rows = await getAppointmentTypesByRangeQuery(startStr, endStr, clinicId);
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return rows.map((r) => ({
    type: r.type,
    label: APPOINTMENT_TYPE_LABELS[r.type] || r.type,
    count: r.count,
    percent: total === 0 ? 0 : Math.round((r.count / total) * 1000) / 10,
  }));
};

export const getAppointmentsChartService = async (timeframe, clinicId = null) => {
  if (!isValidTimeframe(timeframe)) {
    throw new Error(`Invalid timeframe. Use one of: daily, weekly, monthly, yearly`);
  }
  const { start, end } = getTimeframeBounds(timeframe);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  return getAppointmentsChartQuery(timeframe, startStr, endStr, clinicId);
};

export const getDoctorsAtWorkService = async (clinicId = null) => {
  return getDoctorsAtWorkQuery(clinicId);
};

export const getApprovalRequestsService = async (clinicId = null) => {
  return getApprovalRequestsQuery(clinicId);
};
