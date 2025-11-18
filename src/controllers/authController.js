import { loginService, signupService } from "../services/authService.js";
import { sendResponse } from "../utils/response.js";

export const signup = async (req, res) => {
  try {
    const user = await signupService(req.body);
    return sendResponse(res, 200, "Signed up successfull", user);
  } catch (error) {
    return sendResponse(res, 400, error.message, null);
  }
};

export const login = async (req, res) => {
  try {
    const data = await loginService(req.body);
    return sendResponse(res, 200, "Successfully logged in", data);
  } catch (error) {
    return sendResponse(res, 400, error.message, null);
  }
};
