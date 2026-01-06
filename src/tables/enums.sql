DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_type'
    ) THEN
        CREATE TYPE user_type AS ENUM ('SUPERADMIN','INTERNAL', 'EXTERNAL');
    END IF;
END $$;
