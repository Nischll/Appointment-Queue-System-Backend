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
  //  Get historical metrics
  const metrics = await getAppointmentMetricsService(
    doctorId,
    clinicId,
    departmentId,
    appointmentType,
  );

  // Get live queue
  const queue = await getAppointmentQueueService(
    doctorId,
    clinicId,
    departmentId,
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

  // Remaining time of current appointment
  let remainingCurrent = 0;
  if (current && current.actual_start_time) {
    const elapsed =
      (Date.now() - new Date(current.actual_start_time).getTime()) / 60000;

    // remainingCurrent = Math.max(metrics.avg_duration - elapsed, 0);
    remainingCurrent = Math.max(effectiveAvgDuration - elapsed, 0);
  }

  // Time for patients ahead
  let aheadTime = 0;

  ahead.forEach(() => {
    // const adjustedDuration =
    //   metrics.avg_duration * (1 - metrics.no_show_rate * 0.5);
    const adjustedDuration =
      effectiveAvgDuration * (1 - metrics.no_show_rate * 0.5);

    aheadTime += adjustedDuration;
  });

  // Final prediction
  const predictedWait = remainingCurrent + aheadTime + metrics.avg_start_delay;

  // Confidence calculation
  // let confidence = "LOW";
  // if (metrics.sample_size > 30) confidence = "HIGH";
  // else if (metrics.sample_size > 10) confidence = "MEDIUM";
  let confidence = "LOW";

  if (regressionConfidence) {
    confidence = regressionConfidence;
  } else if (metrics.sample_size > 30) {
    confidence = "HIGH";
  } else if (metrics.sample_size > 10) {
    confidence = "MEDIUM";
  }

  return {
    predicted_wait_minutes: Math.round(predictedWait),
    my_position,
    confidence,
    explanation: {
      remaining_current_minutes: Math.round(remainingCurrent),
      patients_ahead: ahead.length,
      avg_duration_used: Number(effectiveAvgDuration.toFixed(2)),
      base_avg_duration: metrics.avg_duration,
      avg_start_delay: metrics.avg_start_delay,
      no_show_rate: metrics.no_show_rate,
      model_used: regressionModel ? "LINEAR_REGRESSION" : "AVERAGE",
    },
  };
};
