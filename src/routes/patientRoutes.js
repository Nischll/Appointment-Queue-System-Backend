import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";
import {
  createPatient,
  deletePatient,
  getAllPatient,
  getPatientById,
} from "../controllers/patientController.js";

const router = express.Router();

router.post("/", authenticate, authorizeModule("PM", "write"), createPatient);
router.get("/", authenticate, authorizeModule("PM", "read"), getAllPatient);
router.get("/:id", authenticate, authorizeModule("PM", "read"), getPatientById);
router.delete("/:id", authenticate, authorizeModule("PM", "read"), deletePatient);

export default router;
