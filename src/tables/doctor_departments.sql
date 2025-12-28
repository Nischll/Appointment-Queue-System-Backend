CREATE TABLE IF NOT EXISTS doctor_departments (
  id SERIAL PRIMARY KEY,
  doctor_id INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  status BOOLEAN DEFAULT TRUE, -- active/inactive mapping
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_doctor_departments UNIQUE (doctor_id, department_id)
);

-- CREATE UNIQUE INDEX unique_active_doctor_department
-- ON doctor_departments (doctor_id, department_id)
-- WHERE status = TRUE;
