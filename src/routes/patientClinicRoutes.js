import express from "express";
import { authenticate } from "../middleware/auth.js";
import { requireExternalUser } from "../middleware/requireExternalUser.js";
import { getClinics } from "../controllers/clinicController.js";

const router = express.Router();

router.get("/", authenticate, requireExternalUser, getClinics);

export default router;
