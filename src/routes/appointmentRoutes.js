import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";
import {
  cancelAppointment,
  checkInAppointment,
  completeAppointment,
  todayAppointmentsWithWaitingTime,
  noShowAppointment,
  staffBookAppointment,
  startAppointment,
  getAppointmentHistory,
} from "../controllers/appointmentController.js";

const router = express.Router();

router.post(
  "/book",
  authenticate,
  authorizeModule("AM", "write"),
  staffBookAppointment,
);
router.put(
  "/check-in/:id",
  authenticate,
  authorizeModule("AM", "update"),
  checkInAppointment,
);
router.put(
  "/start/:id",
  authenticate,
  authorizeModule("AM", "update"),
  startAppointment,
);
router.put(
  "/complete/:id",
  authenticate,
  authorizeModule("AM", "update"),
  completeAppointment,
);
router.put(
  "/cancel/:id",
  authenticate,
  authorizeModule("AM", "update"),
  cancelAppointment,
);
router.put(
  "/no-show/:id",
  authenticate,
  authorizeModule("AM", "update"),
  noShowAppointment,
);
router.get(
  "/",
  authenticate,
  authorizeModule("AM", "read"),
  todayAppointmentsWithWaitingTime,
);
router.get(
  "/history",
  authenticate,
  authorizeModule("AM", "read"),
  getAppointmentHistory,
);

export default router;
