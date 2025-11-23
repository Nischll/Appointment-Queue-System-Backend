import express from "express";
import "./config/db.js";
import "./config/initDb.js";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import clinicRoutes from "./routes/clinicRoutes.js";
import initRoutes from "./routes/initRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import cors from "cors";
import { initDb } from "./config/initDb.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

initDb().catch((err) => {
  console.error("DB init error: ", err);
});

app.use("/api/auth", authRoutes);
app.use("/api/clinics", clinicRoutes);
app.use("/api/init", initRoutes);
app.use("/api/role", roleRoutes);

export default app;
