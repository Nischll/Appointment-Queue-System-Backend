import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "aqms",
  password: "postgres",
  port: 5433,
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL Database");
});

// Force the first connection on startup
pool
  .connect()
  .then((client) => {
    client.release(); // release back to pool
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

export default pool;
