import { UserDto } from "../dto/userDto.js";
import {
  createUserService,
  getUsersByTypeService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
  getAllUsersService,
} from "../services/userService.js";
import { sendResponse } from "../utils/response.js";

export const createUser = async (req, res) => {
  try {
    const dto = new UserDto(req.body);
    const data = await createUserService(dto);
    sendResponse(res, 201, "User created successfully", data.id);
  } catch (err) {
    console.error("error adding staff:", err);
    sendResponse(res, 400, err.message);
  }
};

export const listUsers = async (req, res) => {
  try {
    const users = await getAllUsersService();
    sendResponse(res, 200, "Users fetched successfully", users);
  } catch (err) {
    console.error("Get users error:", err);
    sendResponse(res, 500, err.message);
  }
};

export const getUsersByType = async (req, res) => {
  try {
    const users = await getUsersByTypeService(req.query.type);
    sendResponse(res, 200, "Users fetched successfully", users);
  } catch (err) {
    console.error("Get users by type error:", err);

    sendResponse(res, 404, err.message);
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await getUserByIdService(req.params.id);
    sendResponse(res, 200, "User fetched successfully", user);
  } catch (err) {
    console.error("Get user by id error:", err);

    sendResponse(res, 404, err.message);
  }
};

export const updateUser = async (req, res) => {
  try {
    const dto = new UserDto(req.body);
    const user = await updateUserService(req.params.id, dto);
    sendResponse(res, 200, "User updated successfully", user.id);
  } catch (err) {
    console.error("update user error:", err);

    sendResponse(res, 400, err.message);
  }
};

export const deleteUser = async (req, res) => {
  try {
    await deleteUserService(req.params.id);
    sendResponse(res, 200, "User deleted successfully");
  } catch (err) {
    console.error("delete user error:", err);

    sendResponse(res, 404, err.message);
  }
};
