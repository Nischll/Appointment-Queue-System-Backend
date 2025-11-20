export class SignupDto {
  constructor(body) {
    this.fullName = body.fullName?.trim();
    this.email = body.email?.trim();
    this.password = body.password;
  }
}
