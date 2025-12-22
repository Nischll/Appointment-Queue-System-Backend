export class DoctorDto {
  constructor(body) {
      (this.clinic_id = body.clinic_id),
      (this.name = body.name),
      (this.specialization = body.specialization),
      (this.phone = body.phone),
      (this.email = body.email);
  }
}
