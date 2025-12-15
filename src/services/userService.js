// src/services/userService.js
import bcrypt from "bcrypt";
import {
  getUsersByRoleQuery ,
  getAllUsersQuery,
  createUserQuery,
  getUserByIdQuery,
  updateUserQuery,
  deleteUserQuery
} from "../models/userModel.js";

  export const createUserService = async (dto) => {
    const { fullname, email, password, role_id, isActive } = dto;

    // check email existence
    // const existingUser = await getUserByIdByEmail(email);
    // if (existingUser) {
    //   throw new Error("Email already exists");
    // }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = await createUserQuery({
      fullname,
      email,
      hashedPassword,
      role_id,
      isActive
    });

    return userId;
  };


export const listUsersService = async () => {
  return await getAllUsersQuery();
};
export const getUsersByTypeService = async (type) => {
  const users = await getUsersByRoleQuery(type);

  if (users.length === 0) {
    throw new Error("No users found for this role");
  }

  return users;
};

export const getUserByIdService = async (id) => {
  const user = await getUserByIdQuery(id);
  if (!user) throw new Error("User not found");
  return user;
};

export const updateUserService = async (id, dto) => {
  return await updateUserQuery(id, dto);
};

export const deleteUserService = async (id) => {
  const deleted = await deleteUserQuery(id);
  if (!deleted) throw new Error("User not found or already deleted");
  return deleted;
};
