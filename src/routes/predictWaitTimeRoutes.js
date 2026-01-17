import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";
import { predictWaitTime } from "../controllers/predictWaitTimeController.js";

const router = express.Router();

router.get("/", authenticate, authorizeModule("AM", "read"), predictWaitTime);

export default router;
