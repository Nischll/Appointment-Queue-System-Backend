import APPOINTMENT_STATUS from "../enums/appointmentStatus.enum.js";
import { getAppointmentQueueQuery } from "../models/appointmentQueueModel.js";

export const getAppointmentQueueService = async (
  doctorId,
  clinicId,
  departmentId,
  appointmentDate,
  appointmentId = null,
) => {
  if (!doctorId || !clinicId || !departmentId || !appointmentDate) {
    throw new Error("Missing required parameters for queue.");
  }

  const queue = await getAppointmentQueueQuery(
    doctorId,
    clinicId,
    departmentId,
    appointmentDate,
  );

  if (queue.length === 0) {
    return {
      current: null,
      ahead: [],
      my_position: null,
      total_in_queue: 0,
    };
  }

  const current =
    queue.find((a) => a.status === APPOINTMENT_STATUS.In_progress) || null;

  let myPosition = null;
  if (appointmentId) {
    const index = queue.findIndex((a) => a.id === appointmentId);
    myPosition = index >= 0 ? index + 1 : null;
  }

  const ahead = myPosition
    ? queue.slice(0, myPosition - 1)
    : queue.filter((a) => a.status !== APPOINTMENT_STATUS.In_progress);

  return {
    current,
    ahead,
    my_position: myPosition,
    total_in_queue: queue.length,
  };
};
