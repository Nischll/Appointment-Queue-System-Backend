CREATE TABLE IF NOT EXISTS doctor_shifts (
    id SERIAL PRIMARY KEY,

    doctor_id INT NOT NULL,
    clinic_id INT NOT NULL,

    day_of_week SMALLINT NOT NULL, -- 1 = Monday ... 7 = Sunday

    start_time TIME,
    end_time TIME,

    is_day_off BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 🔗 Foreign Keys
    CONSTRAINT fk_shift_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_shift_clinic
        FOREIGN KEY (clinic_id)
        REFERENCES clinics(id)
        ON DELETE CASCADE,

    -- 🚫 Prevent duplicate shifts per doctor + clinic + day
    CONSTRAINT unique_doctor_clinic_day
        UNIQUE (doctor_id, clinic_id, day_of_week),

    -- ✅ Valid day range (1–7)
    CONSTRAINT valid_day_of_week
        CHECK (day_of_week BETWEEN 1 AND 7),

    -- ⏱ Valid time logic
    CONSTRAINT valid_time_range
        CHECK (
            is_day_off = TRUE
            OR (
                start_time IS NOT NULL
                AND end_time IS NOT NULL
                AND start_time < end_time
            )
        )
);

-- CREATE INDEX idx_doctor_shifts_doctor ON doctor_shifts (doctor_id);
-- CREATE INDEX idx_doctor_shifts_clinic ON doctor_shifts (clinic_id);
-- CREATE INDEX idx_doctor_shifts_day ON doctor_shifts (day_of_week);
