import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";
import {
  createDoctor,
  deleteDoctor,
  getDoctors,
  updateDoctor,
} from "../controllers/doctorController.js";

const router = express.Router();

router.post("/", authenticate, authorizeModule("DM", "write"), createDoctor);
router.get("/", authenticate, authorizeModule("DM", "read"), getDoctors);
router.put("/:id", authenticate, authorizeModule("DM", "update"), updateDoctor);
router.delete(
  "/:doctorId/:departmentId",
  authenticate,
  authorizeModule("DM", "delete"),
  deleteDoctor
);

export default router;
