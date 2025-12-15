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

const router = express.Router();

router.post("/addUsers", createUser);
router.get("/staffByType", getUsersByType);
router.get("/getStaff", listUsers);
router.get("/id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
