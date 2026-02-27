import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";
import {
  getAppointmentCountByStatus,
  getSummary,
  getAppointmentTypes,
  getAppointmentsChart,
  getDoctorsAtWork,
  getApprovalRequests,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get(
  "/appointment-count",
  authenticate,
  authorizeModule("D", "read"),
  getAppointmentCountByStatus,
);

router.get(
  "/summary",
  authenticate,
  authorizeModule("D", "read"),
  getSummary,
);

router.get(
  "/appointment-types",
  authenticate,
  authorizeModule("D", "read"),
  getAppointmentTypes,
);

router.get(
  "/appointments-chart",
  authenticate,
  authorizeModule("D", "read"),
  getAppointmentsChart,
);

router.get(
  "/doctors-at-work",
  authenticate,
  authorizeModule("D", "read"),
  getDoctorsAtWork,
);

router.get(
  "/approval-requests",
  authenticate,
  authorizeModule("D", "read"),
  getApprovalRequests,
);

export default router;
