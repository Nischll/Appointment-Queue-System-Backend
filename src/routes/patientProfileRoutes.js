import express from "express";
import { authenticate } from "../middleware/auth.js";
import { requireExternalUser } from "../middleware/requireExternalUser.js";
import {
  changePassword,
  getMyProfile,
  updateMyProfile,
} from "../controllers/patientProfileController.js";

const router = express.Router();

// All routes require authentication and patient (EXTERNAL) role only.
router.use(authenticate);
router.use(requireExternalUser);

router.get("/", getMyProfile);
router.put("/", updateMyProfile);
router.post("/change-password", changePassword);

export default router;
