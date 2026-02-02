import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import "./config/db.js";
import "./config/initDb.js";
import { initDb } from "./config/initDb.js";
import authRoutes from "./routes/authRoutes.js";
import clinicRoutes from "./routes/clinicRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import initRoutes from "./routes/initRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import doctorShiftRoutes from "./routes/doctorShiftRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import appointmentMetricsRoutes from "./routes/appointmentMetricsRoutes.js";
import appointmentQueueRoutes from "./routes/appointmentQueueRoutes.js";
import predictWaitTimeRoutes from "./routes/predictWaitTimeRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

initDb().catch((err) => {
  console.error("DB init error: ", err);
});

app.use("/api/auth", authRoutes);
app.use("/api/init", initRoutes);
app.use("/api/role", roleRoutes);

app.use("/api/users", userRoutes);
app.use("/api/patient", patientRoutes);

app.use("/api/clinics", clinicRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/doctor-shifts", doctorShiftRoutes);

app.use("/api/appointments", appointmentRoutes);

// app.use("/api/metrics", appointmentMetricsRoutes);

// app.use("/api/queue", appointmentQueueRoutes);

// app.use("/api/predict-wait-time", predictWaitTimeRoutes);

app.use("/api/dashboard", dashboardRoutes);

export default app;
