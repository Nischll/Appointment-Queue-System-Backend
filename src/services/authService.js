import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";

export const signupService = async (dto) => {
  const { fullName, email, password } = dto;

  const userCheck = await pool.query("SELECT * FROM users WHERE email=$1", [
    email,
  ]);

  if (userCheck.rows.length > 0) {
    throw new Error("User already exist");
  }

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  const roleResult = await pool.query(
    "SELECT id FROM roles WHERE role_name = 'patient'"
  );
  const patientRoleId = roleResult.rows[0].id;

  const newUser = await pool.query(
    'INSERT INTO users ("fullName", email, password, role_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [fullName, email, hashPassword, patientRoleId]
  );

  return newUser.rows[0].id;
};

export const loginService = async (dto) => {
  const { email, password } = dto;

  const userQuery = await pool.query(
    `SELECT u.id, u.email, u.password, r.role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1`,
    [email]
  );

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
    role: user.role_name,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { accessToken, refreshToken };
};
