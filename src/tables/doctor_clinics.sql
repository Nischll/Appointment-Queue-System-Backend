CREATE TABLE IF NOT EXISTS doctor_clinics (
  id SERIAL PRIMARY KEY,
  doctor_id INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  status BOOLEAN DEFAULT TRUE, -- active/inactive mapping
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_doctor_clinic UNIQUE (doctor_id, clinic_id)
);
