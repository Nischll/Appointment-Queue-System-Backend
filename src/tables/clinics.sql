CREATE TABLE IF NOT EXISTS clinics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    contact VARCHAR(20),

    is_active BOOLEAN DEFAULT TRUE, -- soft delete flag

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CREATE UNIQUE INDEX unique_active_clinic_name
-- ON clinics (name)
-- WHERE is_active = TRUE;
