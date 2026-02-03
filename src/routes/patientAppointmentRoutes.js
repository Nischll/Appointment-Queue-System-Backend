import express from "express";
import { authenticate } from "../middleware/auth.js";
import { requireExternalUser } from "../middleware/requireExternalUser.js";
import {
  getPatientAppointmentHistory,
  getPatientLiveAppointments,
  getPatientPendingAppointments,
  patientBookAppointment,
} from "../controllers/appointmentController.js";

const router = express.Router();

// PATIENT
router.post(
  "/book",
  authenticate,
  requireExternalUser,
  patientBookAppointment,
);
router.get(
  "/live",
  authenticate,
  requireExternalUser,
  getPatientLiveAppointments,
);
router.get(
  "/history",
  authenticate,
  requireExternalUser,
  getPatientAppointmentHistory,
);
router.get(
  "/upcoming",
  authenticate,
  requireExternalUser,
  getPatientPendingAppointments,
);
export default router;
