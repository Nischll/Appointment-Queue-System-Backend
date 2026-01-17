import express from "express";
import { getAppointmentMetrics } from "../controllers/appointmentMetricsController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, getAppointmentMetrics);

export default router;