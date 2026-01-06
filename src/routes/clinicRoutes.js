import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createClinic,
  deleteClinic,
  getClinics,
  updateClinic,
} from "../controllers/clinicController.js";
import { authorizeModule } from "../middleware/authorizeModule.js";

const router = express.Router();

router.post("/", authenticate, authorizeModule("CM", "write"), createClinic);
router.get("/", authenticate, authorizeModule("CM", "read"), getClinics);
router.put("/:id", authenticate, authorizeModule("CM", "update"), updateClinic);
router.delete(
  "/:id",
  authenticate,
  authorizeModule("CM", "delete"),
  deleteClinic
);

export default router;
