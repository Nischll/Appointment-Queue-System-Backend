export const trainLinearRegression = (rows) => {
  if (!rows || rows.length < 10) return null;

  let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;

  for (const r of rows) {
    sumX += r.queue_number;
    sumY += r.actual_duration;
    sumXY += r.queue_number * r.actual_duration;
    sumXX += r.queue_number ** 2;
  }

  const n = rows.length;

  const slope =
    (n * sumXY - sumX * sumY) /
    (n * sumXX - sumX * sumX);

  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

export const predictWithRegression = (model, x) => {
  if (!model) return null;
  return model.intercept + model.slope * x;
};
