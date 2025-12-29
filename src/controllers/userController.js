import { UserDto } from "../dto/userDto.js";
import {
    createUserService,
    getUsersByTypeService,
    getUserByIdService,
    updateUserService,
    deleteUserService,
    listUsersService,
} from "../services/userService.js";
import {sendResponse} from "../utils/response.js";


export const createUser = async (req, res) => {
    try {
        const dto = new UserDto(req.body);
        const id = await createUserService(dto);
        sendResponse(res, 201, "User created successfully", { id });
    } catch (err) {
        sendResponse(res, 400, err.message);
    }
};

export const listUsers = async (req, res) => {
    try {
        const users = await listUsersService();
        sendResponse(res, 200, "Users fetched successfully", users);
    } catch (err) {
        sendResponse(res, 500, err.message);
    }
};

export const getUsersByType = async (req, res) => {
    try {
        const users = await getUsersByTypeService(req.query.type);
        sendResponse(res, 200, "Users fetched successfully", users);
    } catch (err) {
        sendResponse(res, 404, err.message);
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await getUserByIdService(req.params.id);
        sendResponse(res, 200, "User fetched successfully", user);
    } catch (err) {
        sendResponse(res, 404, err.message);
    }
};

export const updateUser = async (req, res) => {
    try {
        const dto = new UserDto(req.body);
        const user = await updateUserService(req.params.id, dto);
        sendResponse(res, 200, "User updated successfully", user);
    } catch (err) {
        sendResponse(res, 400, err.message);
    }
};

export const deleteUser = async (req, res) => {
    try {
        await deleteUserService(req.params.id);
        sendResponse(res, 200, "User deleted successfully");
    } catch (err) {
        sendResponse(res, 404, err.message);
    }
};
