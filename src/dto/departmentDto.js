export class DepartmentDto {
  constructor(body) {
    this.clinic_id = body.clinic_id;
    this.name = body.name?.trim();
  }
}
