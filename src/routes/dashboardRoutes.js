import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";
import { getAppointmentCountByStatus } from "../controllers/dashboardController.js";

const router = express.Router();

router.get(
  "/appointment-count",
  authenticate,
  authorizeModule("D", "read"),
  getAppointmentCountByStatus,
);

export default router;
