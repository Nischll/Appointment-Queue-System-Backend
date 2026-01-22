export const formatTimeToAMPM = (time) => {
  if (!time) return null;

  let hour, minute;

  if (typeof time === "string") {
    const timePart = time.split(" ")[1] || time; // HH:MM:SS
    [hour, minute] = timePart.split(":").map(Number);
  } else if (time instanceof Date) {
    hour = time.getHours();
    minute = time.getMinutes();
  } else {
    return null;
  }

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
};
