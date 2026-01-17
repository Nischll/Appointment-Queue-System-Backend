import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";
import { getAppointmentQueue } from "../controllers/appointmentQueueController.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeModule("AM", "read"),
  getAppointmentQueue,
);

export default router;
