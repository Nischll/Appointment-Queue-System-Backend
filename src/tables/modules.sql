CREATE TABLE IF NOT EXISTS modules (
    id BIGINT PRIMARY KEY,
    parent_id BIGINT,
    orders INT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255) UNIQUE NOT NULL,
    description VARCHAR(500) NOT NULL,
    icon VARCHAR(255),
    path VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    created_by BIGINT,
    updated_by BIGINT
);
