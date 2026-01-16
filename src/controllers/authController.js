import jwt from "jsonwebtoken";
import { LoginDto } from "../dto/loginDto.js";
import { SignupDto } from "../dto/signupDto.js";
import { loginService, signupService } from "../services/authService.js";
import { sendResponse } from "../utils/response.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";

export const signup = async (req, res) => {
  try {
    const dto = new SignupDto(req.body);
    const data = await signupService(dto);
    return sendResponse(res, 200, "Signed up successfully", data);
  } catch (error) {
    console.error("error signing up", error);
    return sendResponse(res, 400, error.message, null);
  }
};

export const login = async (req, res) => {
  try {
    const dto = new LoginDto(req.body);
    const data = await loginService(dto);
    return sendResponse(res, 200, "Successfully logged in", data);
  } catch (error) {
    console.error("error login", error);
    return sendResponse(res, 400, error.message, null);
  }
};

export const logout = (req, res) => {
  try {
    return sendResponse(res, 200, "Succesfully logged out", null);
  } catch (error) {
    console.error("error logout", error);
    return sendResponse(res, 400, error.message, null);
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendResponse(res, 403, "Refresh token required", null);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const payload = {
      id: decoded.id,
      email: decoded.email,
      user_type: decoded.user_type,
      role: decoded.role || null,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    return sendResponse(res, 200, "Access Token Refreshed", {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return sendResponse(res, 401, "Invalid or expired refresh token", null);
  }
};
