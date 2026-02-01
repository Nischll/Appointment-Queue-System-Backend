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
  updateAppointment,
  patientBookAppointment,
  getPatientLiveAppointments,
  getPatientAppointmentHistory,
  approveAppointment,
  rejectAppointment,
  getPatientPendingAppointments,
  getUpcomingAppointments,
} from "../controllers/appointmentController.js";
import { requireExternalUser } from "../middleware/requireExternalUser.js";

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
  "/live",
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
router.put(
  "/update/:id",
  authenticate,
  authorizeModule("AM", "update"),
  updateAppointment,
);
router.get(
  "/upcoming",
  authenticate,
  authorizeModule("AM", "read"),
  getUpcomingAppointments,
);
router.post(
  "/approve/:id",
  authenticate,
  authorizeModule("AM", "read"),
  approveAppointment,
);
router.post(
  "/reject/:id",
  authenticate,
  authorizeModule("AM", "read"),
  rejectAppointment,
);

// PATIENT
router.post(
  "/patient/book",
  authenticate,
  requireExternalUser,
  patientBookAppointment,
);
router.get(
  "/patient/live",
  authenticate,
  requireExternalUser,
  getPatientLiveAppointments,
);
router.get(
  "/patient/history",
  authenticate,
  requireExternalUser,
  getPatientAppointmentHistory,
);
router.get(
  "/patient/upcoming",
  authenticate,
  requireExternalUser,
  getPatientPendingAppointments,
);

export default router;
