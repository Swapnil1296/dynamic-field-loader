CREATE TABLE IF NOT EXISTS form_configurations (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(100) NOT NULL,
    channel_code VARCHAR(100) NOT NULL,
    sub_channel_code VARCHAR(100) NOT NULL,
    configuration JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    proposal_number VARCHAR(100) UNIQUE NOT NULL,
    product_code VARCHAR(100) NOT NULL,
    channel_code VARCHAR(100) NOT NULL,
    sub_channel_code VARCHAR(100) NOT NULL,
    proposal_data JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    proposal_number VARCHAR(100) NOT NULL,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_form_config_lookup
    ON form_configurations (product_code, channel_code, sub_channel_code);

CREATE INDEX IF NOT EXISTS idx_proposals_number ON proposals (proposal_number);
