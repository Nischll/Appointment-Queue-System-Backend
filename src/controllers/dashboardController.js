import { getAppointmentCountByStatusService } from "../services/dashboardService.js";
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
