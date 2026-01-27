import USER_TYPE from "../enums/userType.enum.js";
import { sendResponse } from "../utils/response.js";

export const requireExternalUser = (req, res, next) => {
  if (!req.user || req.user.user_type !== USER_TYPE.External) {
    return sendResponse(res, 403, "Patient access only", null);
  }
  next();
};
