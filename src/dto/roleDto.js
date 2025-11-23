export class RoleDto {
  constructor(body) {
    this.role_name = body.role_name;
    this.code = body.code;
    this.description = body.description;
  }
}
