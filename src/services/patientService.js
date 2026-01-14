import pool from "../config/db.js";
import {
  deletePatientQuery,
  getAllPatientQuery,
  getPatientByIdQuery,
  updatePatientQuery,
} from "../models/patientModel.js";
import { createPatientCore } from "./authService.js";

export const createPatientService = async (dto) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Admin is allowed to override some defaults
    const payload = {
      ...dto,
      is_active: true, // or false if you want approval flow
    };

    const userId = await createPatientCore(client, payload);

    await client.query("COMMIT");
    return userId;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const getAllPatientService = async () => {
  return await getAllPatientQuery();
};

export const getPatientByIdService = async (patientId) => {
  if (!patientId) {
    throw new Error("Patient is not found.");
  }
  return await getPatientByIdQuery(patientId);
};

export const deletePatientService = async (patientId) => {
  if (!patientId) {
    throw new Error("Patient is not found.");
  }
  return await deletePatientQuery(patientId);
};

export const updatePatientService = async (patientId, data) => {
  if (!patientId) {
    throw new Error("Patient is not found.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await updatePatientQuery(client, patientId, data);

    if (!result) {
      throw new Error("Patient profile not found.");
    }

    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
