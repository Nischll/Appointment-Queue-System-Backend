import bcrypt from "bcrypt";
import {
  createUserQuery,
  updateUserQuery,
  deleteUserQuery,
  assignStaffToClinicQuery,
  deleteStaffClinicsQuery,
  getUserByIdWithClinicsQuery,
  getStaffWithClinicsQuery,
} from "../models/userModel.js";
import { mapUserToResponse } from "../mappers/userMapper.js";

export const createUserService = async (dto) => {
  const {
    full_name,
    username,
    email,
    password,
    phone,
    gender,
    role_id,
    clinic_ids,
    isActive,
  } = dto;

  const hashedPassword = await bcrypt.hash(password, 10);

  const userId = await createUserQuery({
    full_name,
    username,
    email,
    hashedPassword,
    phone,
    gender,
    role_id,
    isActive,
  });

  if (clinic_ids.length > 0) {
    for (const clinicId of clinic_ids) {
      await assignStaffToClinicQuery(userId, clinicId);
    }
  }

  return userId;
};

// export const listUsersService = async () => {
//   const users = await getAllUsersQuery();
//   return users.map(mapUserToResponse);
// };

export const getAllUsersService = async () => {
  const users = await getStaffWithClinicsQuery();

  return users.map((u) => ({
    id: u.id,
    fullName: u.full_name,
    username: u.username,
    email: u.email,
    phone: u.phone,
    gender: u.gender,
    roleName: u.role_name,
    roleId: u.role_id,
    isActive: u.isactive,
    clinics: u.clinics,
  }));
};

// export const getUsersByTypeService = async (type) => {
//   const users = await getUsersByRoleQuery(type);

//   if (users.length === 0) {
//     throw new Error("No users found for this role");
//   }

//   return users.map(mapUserToResponse);
// };

export const getUserByIdService = async (id) => {
  const user = await getUserByIdWithClinicsQuery(id);
  if (!user) throw new Error("User not found");

  return {
    id: user.id,
    fullName: user.full_name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    roleName: user.role_name,
    roleId: user.role_id,
    isActive: user.isactive,
    clinics: user.clinics,
  };
};

export const updateUserService = async (id, dto) => {
  const { clinic_ids } = dto;

  const updatedUser = await updateUserQuery(id, dto);
  if (!updatedUser) throw new Error("User not found");

  if (Array.isArray(clinic_ids)) {
    await deleteStaffClinicsQuery(id);

    for (const clinicId of clinic_ids) {
      await assignStaffToClinicQuery(id, clinicId);
    }
  }

  return mapUserToResponse(updatedUser);
};

export const deleteUserService = async (id) => {
  const deleted = await deleteUserQuery(id);
  if (!deleted) throw new Error("User not found or already deleted");
  return true;
};

// const pass = await bcrypt.hash("Admin@123", 10);
// console.log(pass)
