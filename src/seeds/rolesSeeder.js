import pool from "../config/db.js";

const defaultRoles = [
  {
    role_name: "admin",
    code: "ADMIN",
    description: "System Administrator",
  },
  {
    role_name: "patient",
    code: "PATIENT",
    description: "Register patient user",
  },
];

const seedRoles = async () => {
  try {
    // for (const role of defaultRoles) {
    //   const res = await pool.query(
    //     `INSERT INTO roles (role_name, code, description)
    //      VALUES ($1, $2, $3)
    //      ON CONFLICT (role_name) DO NOTHING
    //      RETURNING *`,
    //     [role.role_name, role.code, role.description]
    //   );

    //   console.log("Insert result:", res.rows);
    // }
    for (const role of defaultRoles) {
      const exists = await pool.query(
        `SELECT id FROM roles WHERE role_name = $1`,
        [role.role_name]
      );
      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO roles (role_name, code, description) VALUES ($1, $2, $3)`,
          [role.role_name, role.code, role.description]
        );
      }
    }
    console.log("Default roles seeded successfully");
  } catch (error) {
    console.error("Error seeding roles:", error);
  }
};

export default seedRoles;
