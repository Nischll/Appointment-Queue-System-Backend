import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  changePassword,
  getMyProfile,
  updateMyProfile,
} from "../controllers/staffProfileController.js";
import { authorizeModule } from "../middleware/authorizeModule.js";

const router = express.Router();

router.get("/", authenticate, authorizeModule("P", "read"), getMyProfile);
router.put("/", authenticate, authorizeModule("P", "update"), updateMyProfile);
router.post("/change-password", authenticate, authorizeModule("P", "update"), changePassword);

export default router;
