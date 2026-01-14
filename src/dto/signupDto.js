export class SignupDto {
  constructor(body) {
    this.full_name = body.full_name?.trim();
    this.username = body.username?.trim();
    this.email = body.email?.trim();
    this.password = body.password;
    this.phone = body.phone?.trim();
    this.gender = body.gender;
    this.date_of_birth = body.date_of_birth?.trim();
    this.age = body.age;
    this.address = body.address?.trim();
    this.blood_group = body.blood_group;
    this.emergency_contact_name = body.emergency_contact_name?.trim();
    this.emergency_contact_phone = body.emergency_contact_phone?.trim();
  }
}
