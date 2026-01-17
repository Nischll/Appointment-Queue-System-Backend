export class StaffAppointmentDto {
  constructor(body) {
    this.patient_id = body.patient_id;
    this.clinic_id = body.clinic_id;
    this.department_id = body.department_id;
    this.doctor_id = body.doctor_id;
    this.appointment_type = body.appointment_type;
    this.appointment_date = body.appointment_date;
    this.scheduled_start_time = body.scheduled_start_time;
    this.notes = body.notes || null;
    this.is_walk_in = body.is_walk_in || false;

    this.validate();
  }

  validate() {
    if (!this.patient_id) throw new Error("Patient is required");
    if (!this.clinic_id) throw new Error("Clinic is required");
    if (!this.department_id) throw new Error("Department is required");
    if (!this.doctor_id) throw new Error("Doctor is required");
    if (!this.appointment_type) throw new Error("Appointment type is required");
    if (!this.appointment_date) throw new Error("Appointment date is required");
    if (!this.scheduled_start_time)
      throw new Error("Scheduled start time is required");
  }
}

export class CancelAPpointmentDto {
  constructor(body) {
    this.reason = body.reason?.trim();
  }
}
