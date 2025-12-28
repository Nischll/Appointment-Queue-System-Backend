CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  clinic_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_department_clinic
    FOREIGN KEY (clinic_id)
    REFERENCES clinics(id)
    ON DELETE CASCADE
);

-- CREATE UNIQUE INDEX unique_department_per_clinic
-- ON departments (clinic_id, LOWER(name))
-- WHERE status = TRUE;
