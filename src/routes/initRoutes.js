import express from "express";
import { authenticate } from "../middleware/auth.js";
import { init } from "../controllers/initController.js";

const router = express.Router();

router.get("/", authenticate, init);

export default router;
