import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "aqms",
  password: "postgres",
  port: 5433,
});

/* ─────────────────── CONSTANTS ─────────────────── */

const KATHMANDU_STREETS = [
  "Thamel", "Baneshwor", "Patan", "Jawalakhel", "Boudha",
  "Gongabu", "Kalanki", "Maharajgunj", "Balaju", "Chabahil",
  "Lazimpat", "Durbarmarg", "Jhamsikhel", "Sanepa",
];

const CLINIC_NAMES = [
  "Valley General",
  "Kathmandu Ortho Care",
  "Himalayan Derma",
  "Sagarmatha Cardio",
  "Patan ENT Center",
];

const DEPARTMENTS = [
  "General Medicine", "Pediatrics", "Orthopedics",
  "Dermatology", "Cardiology", "ENT", "Gynecology",
];

const NAMES_FIRST_M = [
  "Aarav", "Rajan", "Bikash", "Suman", "Pradip", "Hari",
  "Ram", "Sanjay", "Anil", "Niranjan", "Keshav", "Dipendra",
  "Bishal", "Surya", "Rajendra", "Kiran",
];

const NAMES_FIRST_F = [
  "Sita", "Gita", "Sushma", "Priya", "Anjali", "Sunita",
  "Kamala", "Saraswati", "Nisha", "Rina", "Binita",
  "Asmita", "Pooja", "Sharmila", "Rachana",
];

const NAMES_LAST = [
  "Sharma", "Thapa", "Gurung", "Tamang", "Magar", "Rai",
  "Limbu", "Maharjan", "Shrestha", "Basnet", "Bhattarai",
  "Adhikari", "Gautam", "Karki", "Khadka",
];

const GENDERS = ["M", "F"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const APPOINTMENT_TYPES = [
  "REGULAR_CHECKUP", "REGULAR_CHECKUP", "REGULAR_CHECKUP",
  "COUNSELLING", "COUNSELLING",
  "FOLLOW_UP", "FOLLOW_UP",
  "OPERATION",
];

const BASE_DURATIONS = {
  COUNSELLING: 30,
  REGULAR_CHECKUP: 15,
  FOLLOW_UP: 10,
  OPERATION: 60,
};

/* ─────────────────── UTILITIES ─────────────────── */

const randInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randElement = (arr) =>
  arr[Math.floor(Math.random() * arr.length)];

const randBoolean = (p = 0.5) => Math.random() < p;

const generatePhone = () => {
  const prefixes = ["984", "985", "986", "980", "981", "982"];
  return `${randElement(prefixes)}${randInt(1000000, 9999999)}`;
};

const addMinutes = (dateStr, timeStr, minutes) => {
  const [h, m] = timeStr.split(":").map(Number);
  // Build timestamp in UTC so .toISOString() matches what Postgres sees
  // when computing (appointment_date + scheduled_start_time).
  // Using local time (new Date without Z) shifts timestamps by the local
  // UTC offset (Nepal = UTC+5:45 = 345 mins), making avg_start_delay
  // massively negative and breaking the wait time prediction.
  const totalMinutes = h * 60 + m + minutes;
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCMinutes(d.getUTCMinutes() + totalMinutes);
  return d;
};

/* ─────────────────── MAIN ─────────────────── */

// Exported so initDb.js can call it in the correct order.
// No longer self-invoking — initDb controls when this runs.
export default async function runSimulation() {
  console.log("Starting Hospital Data Simulation...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* ── 1. Find the superadmin user seeded by superAdminSeeder.js ──
       Used as created_by on appointments (needs a real users.id FK).
       Patients are EXTERNAL with role_id = NULL — no patient role needed. */
    let seedAdminId;
    {
      const roleRes = await client.query(
        `SELECT id FROM roles
         WHERE code = 'SUPERADMIN' OR role_name ILIKE 'superadmin'
         LIMIT 1`
      );
      const superAdminRoleId = roleRes.rows[0]?.id ?? null;

      // superAdminSeeder.js has already run by this point
      const existingAdmin = await client.query(
        `SELECT id FROM users WHERE user_type = 'SUPERADMIN' LIMIT 1`
      );

      if (existingAdmin.rows[0]) {
        seedAdminId = existingAdmin.rows[0].id;
      } else {
        // Fallback: create one if superAdminSeeder somehow didn't run
        const r = await client.query(
          `INSERT INTO users
             (full_name, email, username, password, phone, gender, role_id, user_type)
           VALUES ('Seed Admin', 'seed_admin@hospital.com', 'seed_admin',
                   '$2b$10$EpG.X/T9eX4P0G5V/t03H.UOT7T3b06y4yvqy4Bq4/I/2XvYm9P6q',
                   '9840000000', 'M', $1, 'SUPERADMIN')
           ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name
           RETURNING id`,
          [superAdminRoleId]
        );
        seedAdminId = r.rows[0].id;
      }
    }
    console.log(`Using admin user id = ${seedAdminId} for created_by`);

    /* ── 2. Clinics & Departments ── */
    const clinics = [];
    const departments = [];

    for (let i = 0; i < 5; i++) {
      const cRes = await client.query(
        `INSERT INTO clinics (name, address, contact, is_active)
         VALUES ($1, $2, $3, true) RETURNING id`,
        [
          CLINIC_NAMES[i],
          `${randElement(KATHMANDU_STREETS)}, Kathmandu`,
          generatePhone(),
        ]
      );
      const clinicId = cRes.rows[0].id;
      clinics.push(clinicId);

      const deptCount = randInt(3, 5);
      const selected = [...DEPARTMENTS]
        .sort(() => 0.5 - Math.random())
        .slice(0, deptCount);

      for (const dName of selected) {
        const dRes = await client.query(
          `INSERT INTO departments (clinic_id, name, status)
           VALUES ($1, $2, true) RETURNING id`,
          [clinicId, dName]
        );
        departments.push({ id: dRes.rows[0].id, clinicId, name: dName });
      }
    }
    console.log(`${clinics.length} clinics, ${departments.length} departments created`);

    /* ── 3. Doctors & Shifts ── */
    const doctors = [];
    const numDoctors = randInt(15, 30);

    for (let i = 0; i < numDoctors; i++) {
      const gender = randElement(GENDERS);
      const first =
        gender === "M" ? randElement(NAMES_FIRST_M) : randElement(NAMES_FIRST_F);
      const doctorName = `Dr. ${first} ${randElement(NAMES_LAST)}`;

      const docRes = await client.query(
        `INSERT INTO doctors (name, phone, email, status)
         VALUES ($1, $2, $3, true) RETURNING id`,
        [doctorName, generatePhone(), `doc_${first.toLowerCase()}${i}@hospital.com`]
      );
      const doctorId = docRes.rows[0].id;

      const dept = randElement(departments);

      await client.query(
        `INSERT INTO doctor_departments (doctor_id, department_id, status)
         VALUES ($1, $2, true)
         ON CONFLICT (doctor_id, department_id) DO NOTHING`,
        [doctorId, dept.id]
      );

      doctors.push({ id: doctorId, clinicId: dept.clinicId, deptId: dept.id });

      for (let day = 0; day <= 6; day++) {
        const isDayOff = day === 6 && randBoolean(0.8);

        if (isDayOff) {
          await client.query(
            `INSERT INTO doctor_shifts
               (doctor_id, clinic_id, department_id, day_of_week, is_day_off)
             VALUES ($1, $2, $3, $4, true)`,
            [doctorId, dept.clinicId, dept.id, day]
          );
        } else {
          const shiftType = randElement(["MORNING", "AFTERNOON", "FULL"]);
          const [start, end] =
            shiftType === "MORNING"   ? ["09:00:00", "13:00:00"] :
            shiftType === "AFTERNOON" ? ["14:00:00", "18:00:00"] :
                                        ["09:00:00", "17:00:00"];

          await client.query(
            `INSERT INTO doctor_shifts
               (doctor_id, clinic_id, department_id, day_of_week,
                start_time, end_time, is_day_off)
             VALUES ($1, $2, $3, $4, $5, $6, false)
             ON CONFLICT (doctor_id, clinic_id, day_of_week, start_time, end_time)
             DO NOTHING`,
            [doctorId, dept.clinicId, dept.id, day, start, end]
          );
        }
      }
    }
    console.log(`${numDoctors} doctors created`);

    /* ── 4. Patients (EXTERNAL, role_id = NULL) ── */
    const patientIds = [];

    for (let i = 0; i < 500; i++) {
      const gender = randElement(GENDERS);
      const firstName =
        gender === "M" ? randElement(NAMES_FIRST_M) : randElement(NAMES_FIRST_F);
      const lastName = randElement(NAMES_LAST);
      const suffix = `${i}_${Math.random().toString(36).slice(2, 6)}`;
      const username = `pat_${firstName.toLowerCase()}${suffix}`;

      const uRes = await client.query(
        `INSERT INTO users
           (full_name, email, username, password, phone, gender, role_id, user_type)
         VALUES ($1, $2, $3, $4, $5, $6, NULL, 'EXTERNAL')
         RETURNING id`,
        [
          `${firstName} ${lastName}`,
          `${username}@example.com`,
          username,
          "$2b$10$EpG.X/T9eX4P0G5V/t03H.UOT7T3b06y4yvqy4Bq4/I/2XvYm9P6q",
          generatePhone(),
          gender,
        ]
      );
      const userId = uRes.rows[0].id;
      patientIds.push(userId);

      await client.query(
        `INSERT INTO patient_profiles
           (user_id, age, address, blood_group,
            emergency_contact_name, emergency_contact_phone)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          randInt(1, 85),
          `${randElement(KATHMANDU_STREETS)}, Kathmandu`,
          randElement(BLOOD_GROUPS),
          `${randElement(NAMES_FIRST_M)} ${lastName}`,
          generatePhone(),
        ]
      );
    }
    console.log("500 patients created");

    /* ── 5. Appointments ── */
    const queueCounters = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let inserted = 0;

    for (let i = 0; i < 5000; i++) {
      const patientId = randElement(patientIds);
      const doc = randElement(doctors);
      const appointmentType = randElement(APPOINTMENT_TYPES);

      const offsetDays = randInt(-60, 30);
      const apptDate = new Date(today);
      apptDate.setDate(today.getDate() + offsetDays);
      const dateStr = apptDate.toISOString().split("T")[0];

      const hour = randInt(9, 16);
      const minute = randElement(["00", "15", "30", "45"]);
      const scheduledTimeStr = `${String(hour).padStart(2, "0")}:${minute}:00`;

      const qKey = `${doc.id}_${dateStr}`;
      queueCounters[qKey] = (queueCounters[qKey] || 0) + 1;
      const queueNumber = queueCounters[qKey];

      const isWalkIn = randBoolean(0.15);
      const baseDuration = BASE_DURATIONS[appointmentType];
      const estimatedDuration = Math.round(baseDuration * (0.8 + Math.random() * 0.4));

      let status;
      let checkedInTime   = null;
      let actualStartTime = null;
      let actualEndTime   = null;

      if (offsetDays > 0) {
        status = "BOOKED";
      } else {
        const roll = Math.random();
        if (roll < 0.05) {
          status = "CANCELLED";
        } else if (roll < 0.13) {
          status = "NO_SHOW";
        } else {
          status = "COMPLETED";

          const arrivalOffset = randBoolean(0.85) ? -randInt(5, 20) : randInt(5, 30);
          checkedInTime = addMinutes(dateStr, scheduledTimeStr, arrivalOffset);

          const isPeak = (hour >= 10 && hour <= 12) || (hour >= 15 && hour <= 17);
          const startDelay = randInt(0, 15) + (isPeak ? randInt(10, 25) : 0);
          actualStartTime = addMinutes(dateStr, scheduledTimeStr, startDelay);

          const variance = Math.round(estimatedDuration * 0.3);
          const actualDuration = estimatedDuration + randInt(-variance, variance);
          actualEndTime = new Date(actualStartTime.getTime() + actualDuration * 60000);

          if (actualEndTime <= actualStartTime) {
            actualEndTime = new Date(actualStartTime.getTime() + 5 * 60000);
          }
        }
      }

      await client.query(
        `INSERT INTO appointments
           (patient_id, clinic_id, department_id, doctor_id, created_by,
            status, appointment_type, appointment_date, scheduled_start_time,
            queue_number, is_walk_in, estimated_duration,
            checked_in_time, actual_start_time, actual_end_time, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          patientId, doc.clinicId, doc.deptId, doc.id, seedAdminId,
          status, appointmentType, dateStr, scheduledTimeStr,
          queueNumber, isWalkIn, estimatedDuration,
          checkedInTime   ? checkedInTime.toISOString()   : null,
          actualStartTime ? actualStartTime.toISOString() : null,
          actualEndTime   ? actualEndTime.toISOString()   : null,
          isWalkIn ? "Walk-in patient" : "Regular booking",
        ]
      );

      inserted++;
      if (inserted % 500 === 0) console.log(`  ${inserted} appointments inserted...`);
    }

    await client.query("COMMIT");
    console.log(`
✅ Simulation complete!
   • 5 clinics, ${departments.length} departments
   • ${numDoctors} doctors
   • 500 patients  (user_type = EXTERNAL, role_id = NULL)
   • 5000 appointments (varied types + statuses + real timestamps)
`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Simulation failed — rolled back:", err.message);
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
}