import { getAppointmentCountByStatusQuery } from "../models/dashboardModel.js";

export const getAppointmentCountByStatusService = async (clinicId) => {
  if (!clinicId) {
    throw new Error("Clinic not found");
  }
  const result = await getAppointmentCountByStatusQuery(clinicId);

  return result;
};
