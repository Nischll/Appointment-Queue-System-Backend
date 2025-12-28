export class DoctorDto {
  constructor(body) {
      (this.department_id = body.department_id),
      (this.name = body.name),
      (this.phone = body.phone),
      (this.email = body.email);
  }
}
