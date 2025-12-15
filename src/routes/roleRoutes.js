import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";
import {
  createRole,
  getRoles,
  updateRole,
} from "../controllers/roleController.js";
import {
  getRolePermissions,
  updateRolePermissions,
} from "../controllers/rolePermissionsController.js";

const router = express.Router();

router.post("/", authenticate, authorizeModule("RM", "create"), createRole);
router.get("/", authenticate, authorizeModule("RM", "read"), getRoles);
router.put("/:id", authenticate, authorizeModule("RM", "update"), updateRole);

// Permissions Route
router.get(
  "/permissions/:id",
  authenticate,
  authorizeModule("RM", "read"),
  getRolePermissions
);
router.put(
  "/permissions/:id",
  authenticate,
  authorizeModule("RM", "update"),
  updateRolePermissions
);

export default router;
