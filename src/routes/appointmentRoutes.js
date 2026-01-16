import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";
import {
  checkInAppointment,
  completeAppointment,
  staffBookAppointment,
  startAppointment,
} from "../controllers/appointmentController.js";

const router = express.Router();

router.post(
  "/book",
  authenticate,
  authorizeModule("AM", "write"),
  staffBookAppointment
);
router.put(
  "/check-in/:id",
  authenticate,
  authorizeModule("AM", "update"),
  checkInAppointment
);
router.put(
  "/start/:id",
  authenticate,
  authorizeModule("AM", "update"),
  startAppointment
);
router.put(
  "/complete/:id",
  authenticate,
  authorizeModule("AM", "update"),
  completeAppointment
);

export default router;
