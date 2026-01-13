export class LoginDto {
  constructor(body) {
    this.username = body.username?.trim();
    this.password = body.password;
  }
}
