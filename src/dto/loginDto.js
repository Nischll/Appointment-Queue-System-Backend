export class LoginDto {
  constructor(body) {
    this.email = body.email?.trim();
    this.password = body.password;
  }
}
