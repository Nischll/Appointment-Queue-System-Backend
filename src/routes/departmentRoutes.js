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
  authorizeModule("CM", "write"),
  createDepartment
);
router.get("/", authenticate, authorizeModule("CM", "read"), getDepartments);
router.put(
  "/:id",
  authenticate,
  authorizeModule("CM", "update"),
  updateDepartment
);
router.delete(
  "/:id",
  authenticate,
  authorizeModule("CM", "delete"),
  deleteDepartment
);
export default router;
