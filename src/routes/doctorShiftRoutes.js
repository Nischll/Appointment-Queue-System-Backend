import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";
import { updateDoctorShifts } from "../controllers/doctorShiftController.js";

const router = express.Router();

router.put(
  "/:doctorId/:clinicId",
  authenticate,
  authorizeModule("DM", "update"),
  updateDoctorShifts
);

export default router;
