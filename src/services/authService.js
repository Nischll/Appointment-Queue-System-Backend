import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import USER_TYPE from "../enums/userType.enum.js";

export const signupService = async (dto) => {
  const { full_name, username, email, phone, gender, password } = dto;

  if (!username || !password || !gender) {
    throw new Error("username, password and gender is required.");
  }

  const userCheck = await pool.query("SELECT * FROM users WHERE username=$1", [
    username,
  ]);

  if (userCheck.rows.length > 0) {
    throw new Error("User already exist");
  }

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  const newUser = await pool.query(
    "INSERT INTO users (full_name, username, email, phone, gender, password, user_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [
      full_name,
      username,
      email,
      phone,
      gender,
      hashPassword,
      USER_TYPE.External,
    ]
  );

  return newUser.rows[0].id;
};

export const loginService = async (dto) => {
  const { username, password } = dto;

  const userQuery = await pool.query(
    `
    SELECT 
      u.id,
      u.email,
      u.password,
      u.user_type,
      u.username,
      r.role_name,
      r.code
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.username = $1
    `,
    [username]
  );

  if (userQuery.rows.length === 0) {
    throw new Error("Invalid credentials");
  }

  const user = userQuery.rows[0];

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    user_type: user.user_type,
    role: user.role_name || null,
    roleCode: user.code || null,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { accessToken, refreshToken };
};
