// src/controllers/userController.js
import { UserDto } from "../dto/userDto.js";
import {
  createUserService,
  getUsersByTypeService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
  listUsersService,
} from "../services/userService.js";

export const createUser = async (req, res) => {
  try {
    const dto = new UserDto(req.body);
    const id = await createUserService(dto);
    res.status(200).json({ status: 200, message: "User created", data: { id } });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const users = await listUsersService();
    res.json({ status: 200, message: "Users fetched successfully", data: users });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

export const getUsersByType = async (req, res) => {
  try {
    const type = req.query.type; // e.g. "admin"
    const users = await getUsersByTypeService(type);
    res.json({ status: 200, message: `Users of type ${type} fetched successfully`, data: users });
  } catch (err) {
    res.status(404).json({ status: 404, message: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await getUserByIdService(req.params.id);
    res.json({ status: 200, message: "User fetched successfully", data: user });
  } catch (err) {
    res.status(404).json({ status: 404, message: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const dto = new UserDto(req.body);
    const updated = await updateUserService(req.params.id, dto);
    res.json({ status: 200, message: "User updated successfully", data: updated });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await deleteUserService(req.params.id);
    res.json({ status: 200, message: "User deleted successfully" });
  } catch (err) {
    res.status(404).json({ status: 404, message: err.message });
  }
};
