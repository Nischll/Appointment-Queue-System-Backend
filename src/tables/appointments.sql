CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,

    -- Relations (CRITICAL for prediction scope)
    patient_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_by INT REFERENCES users(id) ON DELETE CASCADE,
    cancelled_by INT REFERENCES users(id) ON DELETE CASCADE,

    -- Appointment classification
    appointment_type apppointment_type NOT NULL,
    
    -- Scheduling
    appointment_date DATE NOT NULL,
    scheduled_start_time TIME NOT NULL,

    -- Queue management
    queue_number INT NOT NULL,
    is_walk_in BOOLEAN DEFAULT FALSE,

    -- Prediction engine inputs
    estimated_duration INT NOT NULL, -- minutes (initial estimate)

    -- Real execution times (THE MOST IMPORTANT PART)
    checked_in_time TIMESTAMP,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,

    -- Status lifecycle
    status appointment_status NOT NULL DEFAULT 'BOOKED',

    -- Meta
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure doctor belongs to clinic + department logically (soft enforcement)
    -- CONSTRAINT valid_status CHECK (
    --     status IN (
    --         'REQUESTED',
    --         'APPROVED',
    --         'REJECTED',
    --         'BOOKED',
    --         'CHECKED_IN',
    --         'IN_PROGRESS',
    --         'COMPLETED',
    --         'NO_SHOW',
    --         'CANCELLED'
    --     )
    -- ),

    -- Queue number must be positive
    CONSTRAINT valid_queue CHECK (queue_number > 0)
);


-- -- Doctor + clinic + department queue lookup
-- CREATE INDEX idx_appointments_queue
-- ON appointments (clinic_id, department_id, doctor_id, appointment_date, status);

-- -- For queue ordering
-- CREATE INDEX idx_appointments_queue_number
-- ON appointments (clinic_id, department_id, doctor_id, appointment_date, queue_number);

-- -- For history-based prediction
-- CREATE INDEX idx_appointments_history
-- ON appointments (doctor_id, clinic_id, department_id, appointment_type, actual_start_time);
