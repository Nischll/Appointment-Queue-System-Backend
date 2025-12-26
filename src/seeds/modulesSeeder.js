import pool from "../config/db.js";

const modules = [
  //Dashboard
  {
    id: 4,
    parent_id: null,
    orders: 1,
    name: "Dashboard",
    code: "D",
    description: "Dashboard",
    icon: "LayoutGrid",
    path: "/home",
  },

  //User Management
  {
    id: 1,
    parent_id: null,
    orders: 2,
    name: "User Management",
    code: "UM",
    description: "User Management",
    icon: "User",
    path: null,
  },
  {
    id: 2,
    parent_id: 1,
    orders: 1,
    name: "Staff Management",
    code: "SM",
    description: "Manage all the staff",
    icon: "UsersRound",
    path: "/staff-management",
  },
  {
    id: 3,
    parent_id: 1,
    orders: 2,
    name: "Role Management",
    code: "RM",
    description: "Manage all the roles.",
    icon: "User",
    path: "/role-management",
  },
  {
    id: 7,
    parent_id: 1,
    orders: 3,
    name: "Clinic Management",
    code: "CM",
    description: "Manage all the clinics.",
    icon: "User",
    path: "/clinic-management",
  },
  {
    id: 8,
    parent_id: 1,
    orders: 4,
    name: "Doctor Management",
    code: "DM",
    description: "Manage all the doctors.",
    icon: "User",
    path: "/doctor-management",
  },


  //Reports
  // {
  //   id: 5,
  //   parent_id: null,
  //   orders: 3,
  //   name: "Reports",
  //   code: "R",
  //   description: "Manage all the reports.",
  //   icon: "User",
  //   path: "/reports",
  // },
  // {
  //   id: 6,
  //   parent_id: null,
  //   orders: 4,
  //   name: "Configuarations",
  //   code: "C",
  //   description: "Manage all the configuarations.",
  //   icon: "User",
  //   path: "/configuarations",
  // },
];

const seedModules = async () => {
  try {
    const result = await pool.query("SELECT count(*) AS cnt FROM modules");
    const count = parseInt(result.rows[0].cnt, 10);
    if (count > 0) {
      console.log("modules table already has data, skipping seeder");
      return;
    }

    for (const m of modules) {
      await pool.query(
        `
        INSERT INTO modules (id, parent_id, orders, name, code, description, icon, path)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO NOTHING
        `,
        [
          m.id,
          m.parent_id,
          m.orders,
          m.name,
          m.code,
          m.description,
          m.icon,
          m.path,
        ]
      );

      console.log(`Inserted module ${m.name}`);
    }
    console.log("Modules seeding completed");
  } catch (error) {
    console.error("Error in modulesSeeder:", error);
  }
};

export default seedModules;
