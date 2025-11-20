import pool from "./db.js";
import fs from "fs";
import path from "path";

const runSqlFile = async (filePath) => {
  try {
    const sql = fs.readFileSync(filePath, "utf-8");
    await pool.query(sql);
    console.log(`${path.basename(filePath)} executed successfully`);
  } catch (err) {
    console.error(`Error executing ${path.basename(filePath)}:`, err);
  }
};

await runSqlFile("./src/models/users.sql");
await runSqlFile("./src/models/clinics.sql");
