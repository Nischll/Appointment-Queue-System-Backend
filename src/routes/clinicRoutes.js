import express from "express";
import { authenticate } from "../middleware/auth.js";
import { createClinic } from "../controllers/clinicController.js";
import { authorizeModule } from "../middleware/authorizeModule.js";

const router = express.Router();

router.post("/", authenticate, authorizeModule("RM", "write", true), createClinic);

export default router;
