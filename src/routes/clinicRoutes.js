import express from "express";
import { authenticate } from "../middleware/auth.js";
import { createClinic } from "../controllers/clinicController.js";

const router = express.Router();

router.post("/", authenticate, createClinic);

export default router;
