import { getAppointmentMetricsQuery } from "../models/appointmentMetricsModel.js";

const DEFAULT_DURATIONS = {
  COUNSELLING: 30,
  REGULAR_CHECKUP: 15,
  FOLLOW_UP: 10,
  OPERATION: 60,
};

export const getAppointmentMetricsService = async (
  doctorId,
  clinicId,
  departmentId,
  appointmentType
) => {
  if (!doctorId || !clinicId || !departmentId || !appointmentType) {
    throw new Error("Missing required parameters for metrics.");
  }

  const metrics = await getAppointmentMetricsQuery(
    doctorId,
    clinicId,
    departmentId,
    appointmentType
  );

  // Handle empty metrics (too few samples)
  const sampleSize = parseInt(metrics.total_appointments, 10);
  const avgDuration =
    Number(metrics.avg_duration_minutes) || DEFAULT_DURATIONS[appointmentType];
  const avgStartDelay = Number(metrics.avg_start_delay_minutes) || 0;
  const noShowRate = Number(metrics.no_show_rate) || 0;

  return {
    avg_duration: Number(avgDuration.toFixed(2)),
    avg_start_delay: Number(avgStartDelay.toFixed(2)),
    no_show_rate: Number(noShowRate.toFixed(2)),
    sample_size: sampleSize,
  };
};
