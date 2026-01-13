export class SignupDto {
  constructor(body) {
    this.full_name = body.full_name?.trim();
    this.username = body.username?.trim();
    this.email = body.email?.trim();
    this.password = body.password;
    this.phone = body.phone?.trim();
    this.gender = body.gender;
  }
}
