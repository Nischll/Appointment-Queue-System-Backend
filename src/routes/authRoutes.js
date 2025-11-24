import express from "express";
import {
  login,
  logout,
  refreshToken,
  signup,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.post("/refresh", refreshToken);

export default router;
