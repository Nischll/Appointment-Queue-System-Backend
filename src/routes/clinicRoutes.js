import express from "express";
import { authenticate } from "../middleware/auth.js";
import { createClinic, getClinics } from "../controllers/clinicController.js";
import { authorizeModule } from "../middleware/authorizeModule.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorizeModule("RM", "write", true),
  createClinic
);
router.get("/", authenticate, authorizeModule("RM", "read", true), getClinics);

export default router;
