CREATE TABLE IF NOT EXISTS patient_profiles (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    age INT,
    address TEXT,
    blood_group VARCHAR(5),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),  
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure at least DOB or age is provided
    CHECK (
        date_of_birth IS NOT NULL
        OR age IS NOT NULL
    )
);
