import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";
import {
  getDoctorShifts,
  updateDoctorShifts,
} from "../controllers/doctorShiftController.js";

const router = express.Router();

router.put(
  // "/:doctorId/:departmentId/:clinicId",
  "/:doctorId/:departmentId",
  authenticate,
  authorizeModule("CM", "update"),
  updateDoctorShifts
);

router.get(
  // "/:doctorId/:departmentId/:clinicId",
  "/:doctorId/:departmentId",
  authenticate,
  authorizeModule("CM", "read"),
  getDoctorShifts
);

export default router;
