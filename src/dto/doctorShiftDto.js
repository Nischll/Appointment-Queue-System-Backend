export class DoctorShiftDto {
  constructor(body) {
    this.day_of_week = body.day_of_week;
    this.is_day_off = body.is_day_off ?? false;

    if (!this.is_day_off) {
      this.start_time = this.convertToTime(body.start_time);
      this.end_time = this.convertToTime(body.end_time);
    } else {
      this.start_time = null;
      this.end_time = null;
    }
  }

  convertToTime(timeStr) {
    if (!timeStr) return null;

    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:00`;
  }
}
