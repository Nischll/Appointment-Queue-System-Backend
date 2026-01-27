import { getRegressionTrainingDataQuery } from "../models/appointmentRegressionModel.js";
import {
  predictWithRegression,
  trainLinearRegression,
} from "../utils/linearRegression.js";
import { getAppointmentMetricsService } from "./appointmentMetricsService.js";
import { getAppointmentQueueService } from "./appointmentQueueService.js";

export const predictWaitTimeService = async ({
  doctorId,
  clinicId,
  departmentId,
  appointmentDate,
  appointmentType,
  appointmentId,
}) => {
  // 1️⃣ Get historical metrics
  const metrics = await getAppointmentMetricsService(
    doctorId,
    clinicId,
    departmentId,
    appointmentType,
  );

  // 2️⃣ Get live queue
  const queue = await getAppointmentQueueService(
    doctorId,
    clinicId,
    departmentId,
    // appointmentType,
    appointmentDate,
    appointmentId,
  );

  const { current, ahead, my_position } = queue;

  // ---------------- REGRESSION (OPTIONAL ENHANCEMENT) ----------------
  let effectiveAvgDuration = metrics.avg_duration;
  let regressionConfidence = null;

  const trainingData = await getRegressionTrainingDataQuery(
    doctorId,
    clinicId,
    departmentId,
    appointmentType,
  );

  const regressionModel = trainLinearRegression(trainingData);

  if (regressionModel && my_position > 0) {
    const predictedDuration = predictWithRegression(
      regressionModel,
      my_position,
    );

    if (predictedDuration && predictedDuration > 0) {
      effectiveAvgDuration = predictedDuration;
      regressionConfidence = trainingData.length >= 30 ? "HIGH" : "MEDIUM";
    }
  }
  // ---------------- WAIT TIME CALCULATION ----------------

  // STEP C — Remaining time of current in-progress patient
  let remainingCurrentMinutes = 0;

  if (
    current &&
    current.status === "IN_PROGRESS" &&
    current.actual_start_time
  ) {
    const est = current.estimated_duration || metrics.avg_duration;
    const elapsedMinutes =
      (Date.now() - new Date(current.actual_start_time).getTime()) / 60000;

    remainingCurrentMinutes = Math.max(0, Math.round(est - elapsedMinutes));
  }

  // STEP D — Time for patients truly waiting ahead (exclude current)
  // STEP D — Time for patients truly waiting ahead (exclude current)
  const waitingAhead = ahead.filter((p) => p.id !== current?.id);

  let aheadTime = 0;

  for (const p of waitingAhead) {
    // use THEIR type, not mine
    const m = await getAppointmentMetricsService(
      doctorId,
      clinicId,
      departmentId,
      p.appointment_type,
    );

    const base = p.estimated_duration || m.avg_duration || metrics.avg_duration;

    const adjusted =
      base * (1 - (m.no_show_rate ?? metrics.no_show_rate) * 0.5);

    aheadTime += adjusted;
  }

  // Final predicted wait (NO double counting)
  const predictedWait =
    remainingCurrentMinutes + aheadTime + metrics.avg_start_delay;

  // Confidence calculation (unchanged)
  let confidence = "LOW";
  if (regressionConfidence) {
    confidence = regressionConfidence;
  } else if (metrics.sample_size > 30) {
    confidence = "HIGH";
  } else if (metrics.sample_size > 10) {
    confidence = "MEDIUM";
  }

  if (!my_position || my_position === 0) {
    return {
      predicted_wait_minutes: 0,
      my_position,
      confidence: "HIGH",
      explanation: null,
    };
  }

  return {
    predicted_wait_minutes: Math.round(predictedWait),
    my_position,
    confidence,
    explanation: {
      remaining_current_minutes: remainingCurrentMinutes,
      patients_ahead: waitingAhead.length,
      avg_duration_used: Number(effectiveAvgDuration.toFixed(2)),
      base_avg_duration: metrics.avg_duration,
      avg_start_delay: metrics.avg_start_delay,
      no_show_rate: metrics.no_show_rate,
      model_used: regressionModel ? "LINEAR_REGRESSION" : "AVERAGE",
    },
  };
};
