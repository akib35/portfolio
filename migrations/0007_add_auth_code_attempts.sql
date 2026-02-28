-- Add attempts counter to auth_codes for brute-force protection
ALTER TABLE auth_codes ADD COLUMN attempts INTEGER DEFAULT 0;
