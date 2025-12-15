export class UserDto {
  constructor(body) {
    this.fullname = body.fullname;
    this.email = body.email;
    this.password = body.password;
    this.role_id = body.role_id;
    this.isActive = body.isActive;   // optional, defaults to true in DB
  }
}
