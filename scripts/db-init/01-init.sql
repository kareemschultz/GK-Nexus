-- GK-Nexus Database Initialization Script
-- ========================================
-- This script runs on first container start

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE gk_nexus TO postgres;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'GK-Nexus database initialized successfully at %', NOW();
END $$;
