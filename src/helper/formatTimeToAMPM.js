export const formatTimeToAMPM = (timeStr) => {
  if (!timeStr) return null;

  const [hourStr, minuteStr] = timeStr.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour.toString().padStart(1, "0")}:${minute
    .toString()
    .padStart(2, "0")} ${ampm}`;
};
