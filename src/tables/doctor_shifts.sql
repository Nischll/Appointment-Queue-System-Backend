CREATE TABLE IF NOT EXISTS doctor_shifts (
    id SERIAL PRIMARY KEY,

    doctor_id INT NOT NULL,
    clinic_id INT NOT NULL,
    department_id INT NOT NULL,

    day_of_week SMALLINT NOT NULL,

    start_time TIME,
    end_time TIME,
    is_day_off BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,

    CONSTRAINT valid_day CHECK (day_of_week BETWEEN 1 AND 7),

    CONSTRAINT valid_time CHECK (
      is_day_off = TRUE OR
      (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
    ),

    CONSTRAINT unique_doctor_clinic_shift
      UNIQUE (doctor_id, clinic_id, day_of_week, start_time, end_time)
);


-- CREATE INDEX idx_doctor_shifts_doctor
--     ON doctor_shifts (doctor_id);

-- CREATE INDEX idx_doctor_shifts_department
--     ON doctor_shifts (department_id);

-- CREATE INDEX idx_doctor_shifts_clinic
--     ON doctor_shifts (clinic_id);

-- CREATE INDEX idx_doctor_shifts_day
--     ON doctor_shifts (day_of_week);

-- -- 🔥 Critical for overlap detection
-- CREATE INDEX idx_doctor_shift_overlap
--     ON doctor_shifts (doctor_id, day_of_week, start_time, end_time)
--     WHERE is_day_off = FALSE;
