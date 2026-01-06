export class UserDto {
  constructor(body) {
    this.full_name = body.full_name;
    this.email = body.email;
    this.password = body.password;
    this.role_id = body.role_id;
    this.clinic_ids = Array.isArray(body.clinic_ids) ? body.clinic_ids : [];
    this.isActive = body.isActive;
  }
}
