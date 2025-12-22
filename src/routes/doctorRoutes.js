import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";
import { createDoctor, getDoctors } from "../controllers/doctorController.js";

const router = express.Router();

router.post("/", authenticate, authorizeModule("DM", "write"), createDoctor);
router.get("/", authenticate, authorizeModule("DM", "read"), getDoctors);

export default router;
