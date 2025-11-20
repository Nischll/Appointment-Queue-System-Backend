export class ClinicDto {
  constructor(body) {
    this.name = body.name;
    this.address = body.address;
    this.contact = body.contact;
  }
}
