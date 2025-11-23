import { initService } from "../services/initService.js";
import { sendResponse } from "../utils/response.js";

export const init = async (req, res) => {
  try {
    const data = await initService(req.user.id);
    return sendResponse(res, 200, "Successfully retrieved contents", data);
  } catch (error) {
    console.error("init API error:", error);
    return sendResponse(res, 500, error.message, null);
  }
};
