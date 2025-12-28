import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";
import {
  getDoctorShifts,
  updateDoctorShifts,
} from "../controllers/doctorShiftController.js";

const router = express.Router();

router.put(
  "/:doctorId/:departmentId",
  authenticate,
  authorizeModule("DM", "update"),
  updateDoctorShifts
);
router.get(
  "/:doctorId/:departmentId",
  authenticate,
  authorizeModule("DM", "read"),
  getDoctorShifts
);

export default router;
