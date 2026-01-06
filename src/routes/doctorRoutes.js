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

router.post("/", authenticate, authorizeModule("CM", "write"), createDoctor);
router.get("/", authenticate, authorizeModule("CM", "read"), getDoctors);
router.put("/:id", authenticate, authorizeModule("CM", "update"), updateDoctor);
router.delete(
  "/:doctorId/:departmentId",
  authenticate,
  authorizeModule("CM", "delete"),
  deleteDoctor
);

export default router;
