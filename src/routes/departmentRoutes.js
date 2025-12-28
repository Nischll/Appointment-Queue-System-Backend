import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeModule } from "../middleware/authorizeModule.js";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../controllers/departmentController.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorizeModule("DM", "write"),
  createDepartment
);
router.get("/", authenticate, authorizeModule("DM", "read"), getDepartments);
router.put(
  "/:id",
  authenticate,
  authorizeModule("DM", "update"),
  updateDepartment
);
router.delete(
  "/:id",
  authenticate,
  authorizeModule("DM", "delete"),
  deleteDepartment
);
export default router;
