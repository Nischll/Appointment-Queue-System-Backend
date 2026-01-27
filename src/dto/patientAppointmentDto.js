export class PatientAppointmentDto {
  constructor(body) {
    this.clinic_id = body.clinic_id;
    this.department_id = body.department_id || null;
    this.doctor_id = body.doctor_id || null;
    this.preferred_date = body.preferred_date;
    this.preferred_time = body.preferred_time;
    this.notes = body.notes;
  }
}
