import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import USER_TYPE from "../enums/userType.enum.js";

export const createPatientCore = async (client, payload) => {
  const {
    full_name,
    username,
    email,
    phone,
    gender,
    password,
    is_active = true,
    date_of_birth,
    age,
    address,
    blood_group,
    emergency_contact_name,
    emergency_contact_phone,
  } = payload;

  if (!username || !password) {
    throw new Error("Username and password required");
  }

  if (!date_of_birth && !age) {
    throw new Error("DOB or age required");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  // users
  const userResult = await client.query(
    `
    INSERT INTO users
      (full_name, username, email, phone, gender, password, user_type, isactive)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
    `,
    [
      full_name,
      username,
      email,
      phone,
      gender,
      hashPassword,
      USER_TYPE.External,
      is_active,
    ]
  );

  const userId = userResult.rows[0].id;

  // patient_profiles
  await client.query(
    `
    INSERT INTO patient_profiles
      (user_id, date_of_birth, age, address, blood_group,
       emergency_contact_name, emergency_contact_phone)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      userId,
      date_of_birth || null,
      age || null,
      address || null,
      blood_group || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
    ]
  );

  return userId;
};

export const signupService = async (dto) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const exists = await client.query(
      "SELECT 1 FROM users WHERE username = $1 AND isactive = TRUE",
      [dto.username]
    );
    if (exists.rows.length) throw new Error("User already exists");

    const userId = await createPatientCore(client, dto);

    await client.query("COMMIT");
    return userId;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
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
    WHERE u.username = $1 AND u.isactive = TRUE
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
