DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_type'
    ) THEN
        CREATE TYPE user_type AS ENUM ('SUPERADMIN','INTERNAL', 'EXTERNAL');
    END IF;
END $$;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'gender'
    ) THEN
        CREATE TYPE gender AS ENUM ('M','F', 'O');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'apppointment_type'
    ) THEN
        CREATE TYPE apppointment_type AS ENUM ('COUNSELLING','REGULAR_CHECKUP', 'FOLLOW_UP', 'OPERATION');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'appointment_status'
    ) THEN
        CREATE TYPE appointment_status AS ENUM (   
            'REQUESTED',
            'REJECTED',
            'BOOKED',
            'CHECKED_IN',
            'IN_PROGRESS',
            'COMPLETED',
            'NO_SHOW',
            'CANCELLED');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'appointment_time'
    ) THEN
        CREATE TYPE appointment_time AS ENUM (   
            'MORNING',
            'AFTERNOON',
            'EVENING',
            'ANY'
            );
    END IF;
END $$;