import pool from "../config/db.js";
import bcrypt from "bcrypt";
import USER_TYPE from "../enums/userType.enum.js";

const seedSuperAdmin = async () => {
  try {
    const email = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;

    if (!email || !password) {
      console.warn("Superadmin credentials not found in env, skipping seeder");
      return;
    }

    // Check if superadmin already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log("Superadmin already exists, skipping seeder");
      return;
    }

    // Get admin role
    const roleResult = await pool.query(
      "SELECT id FROM roles WHERE role_name = 'admin'"
    );

    if (roleResult.rows.length === 0) {
      throw new Error("Admin role not found. Seed roles first.");
    }

    const adminRoleId = roleResult.rows[0].id;
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `
      INSERT INTO users (full_name, email, password, role_id, user_type)
      VALUES ($1, $2, $3, $4, $5)
      `,
      ["Super Admin", email, hashedPassword, adminRoleId, USER_TYPE.SuperAdmin]
    );

    console.log("Superadmin user seeded successfully");
  } catch (error) {
    console.error("Error seeding superadmin:", error);
  }
};

export default seedSuperAdmin;
