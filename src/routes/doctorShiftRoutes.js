import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";
import { updateDoctor } from "../controllers/doctorController.js";

const router = express.Router();

router.put(
  "/:doctorId/:clinicId",
  authenticate,
  authorizeModule("DM", "update"),
  updateDoctor
);

export default router;
