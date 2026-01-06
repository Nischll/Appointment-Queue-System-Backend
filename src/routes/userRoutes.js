// src/routes/userRoute.js
import express from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsersByType,
  listUsers,
  updateUser,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorizeModule("SM", "write"),
  createUser
);
router.get(
  "/staffByType",
  authenticate,
  authorizeModule("SM", "read"),
  getUsersByType
);
router.get("/getStaff", authenticate, authorizeModule("SM", "read"), listUsers);
router.get("/:id", authenticate, authorizeModule("SM", "read"), getUserById);
router.put("/:id", authenticate, authorizeModule("SM", "update"), updateUser);
router.delete(
  "/:id",
  authenticate,
  authorizeModule("SM", "delete"),
  deleteUser
);

export default router;
