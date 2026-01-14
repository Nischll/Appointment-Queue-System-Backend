import pool from "../config/db.js";
import { deletePatientQuery, getAllPatientQuery, getPatientByIdQuery } from "../models/patientModel.js";
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
  if(!patientId){
    throw new Error("Patient is not found.")
  }
  return await getPatientByIdQuery(patientId);
};

export const deletePatientService = async (patientId) => {
  if(!patientId){
    throw new Error("Patient is not found.")
  }
  return await deletePatientQuery(patientId);
};
