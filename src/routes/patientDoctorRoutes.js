import express from "express";
import { authenticate } from "../middleware/auth.js";
import { requireExternalUser } from "../middleware/requireExternalUser.js";
import {
  getPatientDoctors,
} from "../controllers/doctorController.js";

const router = express.Router();

router.get("/", authenticate, requireExternalUser, getPatientDoctors);

export default router;
