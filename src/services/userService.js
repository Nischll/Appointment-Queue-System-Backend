import bcrypt from "bcrypt";
import {
    getUsersByRoleQuery,
    getAllUsersQuery,
    createUserQuery,
    getUserByIdQuery,
    updateUserQuery,
    deleteUserQuery,
} from "../models/userModel.js";
import { mapUserToResponse } from "../mappers/userMapper.js";

export const createUserService = async (dto) => {
    const { fullName, email, password, role_id, isActive } = dto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = await createUserQuery({
        fullName,
        email,
        hashedPassword,
        role_id,
        isActive,
    });

    return userId;
};

export const listUsersService = async () => {
    const users = await getAllUsersQuery();
    return users.map(mapUserToResponse);
};

export const getUsersByTypeService = async (type) => {
    const users = await getUsersByRoleQuery(type);

    if (users.length === 0) {
        throw new Error("No users found for this role");
    }

    return users.map(mapUserToResponse);
};

export const getUserByIdService = async (id) => {
    const user = await getUserByIdQuery(id);
    if (!user) throw new Error("User not found");

    return mapUserToResponse(user);
};

export const updateUserService = async (id, dto) => {
    const updatedUser = await updateUserQuery(id, dto);
    if (!updatedUser) throw new Error("User not found");

    return mapUserToResponse(updatedUser);
};

export const deleteUserService = async (id) => {
    const deleted = await deleteUserQuery(id);
    if (!deleted) throw new Error("User not found or already deleted");
    return true;
};
const pass = await bcrypt.hash("Admin@123", 10);
console.log(pass)