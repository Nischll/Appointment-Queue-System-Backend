import pool from "../config/db.js";

const defaultRoles = [
  {
    role_name: "Super Admin",
    code: "SUPERADMIN",
    description: "System Administrator",
  },
];

const seedRoles = async () => {
  try {
    for (const role of defaultRoles) {
      await pool.query(
        `
        INSERT INTO roles (role_name, code, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (role_name) DO NOTHING
        `,
        [role.role_name, role.code, role.description]
      );
    }

    console.log("Default roles seeded successfully");
  } catch (error) {
    console.error("Error seeding roles:", error);
  }
};

export default seedRoles;
