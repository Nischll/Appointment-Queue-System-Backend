CREATE TABLE IF NOT EXISTS doctor_shifts (
  id SERIAL PRIMARY KEY,
  doctor_id INT NOT NULL REFERENCES doctors(id),
  clinic_id INT NOT NULL REFERENCES clinics(id),
  day_of_week SMALLINT NOT NULL,
  start_time TIME,
  end_time TIME,
  is_day_off BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
