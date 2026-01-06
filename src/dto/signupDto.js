export class SignupDto {
  constructor(body) {
    this.full_name = body.full_name?.trim();
    this.email = body.email?.trim();
    this.password = body.password;
  }
}
