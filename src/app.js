import express from "express";
import "./config/db.js";
import "./config/initDb.js";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import clinicRoutes from "./routes/clinicRoutes.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/clinics", clinicRoutes);

export default app;
