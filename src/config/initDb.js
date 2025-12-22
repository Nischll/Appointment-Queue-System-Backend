import pool from "./db.js";
import fs, { existsSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import seedModules from "../seeds/modulesSeeder.js";
import seedRoles from "../seeds/rolesSeeder.js";

const runSqlFile = async (filePath) => {
  try {
    const sql = fs.readFileSync(filePath, "utf-8");
    await pool.query(sql);
    console.log(`${path.basename(filePath)} executed successfully`);
  } catch (err) {
    console.error(`Error executing ${path.basename(filePath)}:`, err);
  }
};

// await runSqlFile("./src/models/users.sql");
// await runSqlFile("./src/models/modules.sql");
const runSqlFiles = async () => {
  try {
    const modelsDir = path.join(process.cwd(), "src", "tables");
    const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith(".sql"));

    const order = [
      "modules.sql",
      "roles.sql",
      "permissions.sql",
      "users.sql",
      //add other .sql files here
    ];

    for (const name of order) {
      const fp = path.join(modelsDir, name);
      if (existsSync(fp)) await runSqlFile(fp);
    }

    for (const f of files) {
      if (!order.includes(f)) {
        await runSqlFile(path.join(modelsDir, f));
      }
    }
  } catch (error) {
    console.error("initDb error:", error);
  }
};

const seedersDir = path.join(process.cwd(), "src", "seeds");

const runSeeders = async () => {
  try {
    const seederFiles = fs.readdirSync(seedersDir);

    for (const file of seederFiles) {
      const seederPath = path.join(seedersDir, file);
      const moduleUrl = pathToFileURL(seederPath).href;
      await import(moduleUrl);
      console.log(`${file} executed successfully`);
    }
  } catch (err) {
    console.error("Seeder error:", err);
  }
};

export const initDb = async () => {
  await runSqlFiles();
  await runSeeders();
  await seedModules();
  await seedRoles();
};
