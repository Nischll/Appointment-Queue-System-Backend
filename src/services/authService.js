import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";

export const signupService = async ({ fullName, email, password }) => {
  const userCheck = await pool.query("SELECT * FROM users WHERE email=$1", [
    email,
  ]);
  if (userCheck.rows.length > 0) {
    throw new Error("User already exist");
  }

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  const newUser = await pool.query(
    'INSERT INTO users ("fullName", email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [fullName, email, hashPassword, "patient"]
  );

  return newUser.rows[0].id;
};

export const loginService = async ({ email, password }) => {
  const userQuery = await pool.query("SELECT * FROM users WHERE email=$1", [
    email,
  ]);
  if (userQuery.rows.length === 0) {
    throw new Error("Invalid Credentials");
  }

  const user = userQuery.rows[0];

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid Credentials");
  }

  const payload = {
    id: user.id,
    email: user.email,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { accessToken, refreshToken };
};
