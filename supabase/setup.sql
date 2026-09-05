-- ==========================================
-- K MUSE NOVA - Database Setup SQL
-- ==========================================
-- 
-- EXPERIMENTAL VERSION NOTICE:
-- This SQL creates tables for an experimental recruitment system.
-- The users table stores passwords in PLAIN TEXT for testing purposes only.
-- DO NOT use this in production without implementing proper password hashing.
-- 
-- ==========================================

-- Create Users Table
-- NOTE: Passwords are stored as plain text for EXPERIMENTAL purposes only.
-- In production, use bcrypt or Argon2 for password hashing.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,  -- PLAIN TEXT - EXPERIMENTAL ONLY
    full_name TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    primary_category TEXT NOT NULL,
    secondary_category TEXT,
    experience_level TEXT,
    portfolio_url TEXT,
    instagram_url TEXT,
    other_link TEXT,
    languages TEXT,
    skills TEXT,
    about TEXT,
    motivation TEXT,
    status TEXT DEFAULT 'submitted',
    consent_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Application Files Table
CREATE TABLE IF NOT EXISTS application_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL,
    slot_number INTEGER,
    file_path TEXT NOT NULL,
    original_filename TEXT,
    mime_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Application Notes Table
CREATE TABLE IF NOT EXISTS application_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_application_number ON applications(application_number);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_primary_category ON applications(primary_category);
CREATE INDEX IF NOT EXISTS idx_applications_experience_level ON applications(experience_level);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_full_name ON applications(full_name);
CREATE INDEX IF NOT EXISTS idx_applications_mobile ON applications(mobile);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);

-- Application Files indexes
CREATE INDEX IF NOT EXISTS idx_application_files_application_id ON application_files(application_id);
CREATE INDEX IF NOT EXISTS idx_application_files_file_type ON application_files(file_type);
CREATE INDEX IF NOT EXISTS idx_application_files_slot_number ON application_files(slot_number);

-- Application Notes indexes
CREATE INDEX IF NOT EXISTS idx_application_notes_application_id ON application_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_application_notes_admin_user_id ON application_notes(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_application_notes_created_at ON application_notes(created_at);

-- Site Settings indexes
CREATE INDEX IF NOT EXISTS idx_site_settings_setting_key ON site_settings(setting_key);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
-- 
-- IMPORTANT SECURITY NOTICE:
-- This is an EXPERIMENTAL system using custom authentication instead of Supabase Auth.
-- RLS policies below are BASIC and intended for a TESTING environment.
-- 
-- LIMITATIONS:
-- - There is no secure way to identify admin users via RLS without Supabase Auth
-- - The anon key has SELECT access to applications for the submission flow
// - Admin operations should ideally be behind a secure server/API or Supabase Auth
-- - These policies should be reviewed and enhanced for any production use
--
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Users Table Policies
-- PUBLIC: No access (login handled via application logic)
CREATE POLICY "Users: No public select" ON users
    FOR SELECT USING (false);

CREATE POLICY "Users: No public insert" ON users
    FOR INSERT WITH CHECK (false);

CREATE POLICY "Users: No public update" ON users
    FOR UPDATE USING (false);

CREATE POLICY "Users: No public delete" ON users
    FOR DELETE USING (false);

-- Applications Table Policies
-- PUBLIC: Can insert new applications
CREATE POLICY "Applications: Public can insert" ON applications
    FOR INSERT WITH CHECK (true);

-- PUBLIC: Cannot select applications (prevents data exposure)
CREATE POLICY "Applications: No public select" ON applications
    FOR SELECT USING (false);

-- PUBLIC: Cannot update applications
CREATE POLICY "Applications: No public update" ON applications
    FOR UPDATE USING (false);

-- PUBLIC: Cannot delete applications
CREATE POLICY "Applications: No public delete" ON applications
    FOR DELETE USING (false);

-- Application Files Table Policies
-- PUBLIC: Can insert new files
CREATE POLICY "Application Files: Public can insert" ON application_files
    FOR INSERT WITH CHECK (true);

-- PUBLIC: Cannot select files (prevents unauthorized access)
CREATE POLICY "Application Files: No public select" ON application_files
    FOR SELECT USING (false);

-- PUBLIC: Cannot update files
CREATE POLICY "Application Files: No public update" ON application_files
    FOR UPDATE USING (false);

-- PUBLIC: Cannot delete files
CREATE POLICY "Application Files: No public delete" ON application_files
    FOR DELETE USING (false);

-- Application Notes Table Policies
-- PUBLIC: No access (admin only)
CREATE POLICY "Application Notes: No public select" ON application_notes
    FOR SELECT USING (false);

CREATE POLICY "Application Notes: No public insert" ON application_notes
    FOR INSERT WITH CHECK (false);

CREATE POLICY "Application Notes: No public update" ON application_notes
    FOR UPDATE USING (false);

CREATE POLICY "Application Notes: No public delete" ON application_notes
    FOR DELETE USING (false);

-- Site Settings Table Policies
-- PUBLIC: Can only read specific non-sensitive settings
CREATE POLICY "Site Settings: Public can read" ON site_settings
    FOR SELECT USING (
        setting_key IN ('agency_name', 'agency_email', 'instagram_url', 'application_status', 'maintenance_mode')
    );

-- PUBLIC: Cannot insert settings
CREATE POLICY "Site Settings: No public insert" ON site_settings
    FOR INSERT WITH CHECK (false);

-- PUBLIC: Cannot update settings
CREATE POLICY "Site Settings: No public update" ON site_settings
    FOR UPDATE USING (false);

-- PUBLIC: Cannot delete settings
CREATE POLICY "Site Settings: No public delete" ON site_settings
    FOR DELETE USING (false);

-- ==========================================
-- ADMIN SERVICE ROLE POLICIES
-- ==========================================
-- 
-- NOTE: For admin operations in this experimental version,
-- you may need to temporarily use the service_role key
-- in a backend function or adjust RLS policies.
-- 
-- A PROPER implementation would use:
-- 1. Supabase Auth for admin authentication
-- 2. RLS policies based on auth.uid() and auth.jwt()
-- 3. Or a backend API for all admin operations
-- ==========================================

-- ==========================================
-- STORAGE SETUP
-- ==========================================
-- 
-- Run these commands in the Supabase Dashboard SQL Editor
-- or via the Supabase Management API
-- ==========================================

-- Create Storage Bucket for Applications
-- This must be created via Supabase Dashboard or API:
-- 
-- Bucket Name: applications
-- Public: false (private bucket for security)
-- 
-- Via SQL (requires service_role access):
INSERT INTO storage.buckets (id, name, public)
VALUES ('applications', 'applications', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Applications Bucket
-- Allow public to upload files (for application submission)
CREATE POLICY "Applications storage: Public can upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'applications' AND
        (storage.foldername(name))[1] = 'applications'
    );

-- DO NOT allow public to read files (files are private)
CREATE POLICY "Applications storage: No public read" ON storage.objects
    FOR SELECT USING (bucket_id = 'applications' AND false);

-- Allow public to update (needed for the upload process)
CREATE POLICY "Applications storage: Public can update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'applications' AND
        (storage.foldername(name))[1] = 'applications'
    );

-- Do not allow public to delete files
CREATE POLICY "Applications storage: No public delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'applications' AND false);

-- ==========================================
-- INITIAL ADMIN USER
-- ==========================================
-- 
-- EXPERIMENTAL VERSION WARNING:
-- This creates an admin user with a PLAIN TEXT password.
-- CHANGE THE PASSWORD IMMEDIATELY after first login.
-- DO NOT use this approach in production.
-- ==========================================

INSERT INTO users (username, password, full_name, email, role, is_active)
VALUES (
    'admin',
    'CHANGE_THIS_PASSWORD',  -- PLAIN TEXT - CHANGE IMMEDIATELY
    'System Administrator',
    'admin@kmusenova.com',
    'admin',
    true
)
ON CONFLICT (username) DO NOTHING;

-- ==========================================
-- DEFAULT SITE SETTINGS
-- ==========================================

INSERT INTO site_settings (setting_key, setting_value) VALUES
    ('agency_name', 'K MUSE NOVA'),
    ('agency_email', 'contact@kmusenova.com'),
    ('instagram_url', 'https://instagram.com/kmusenova'),
    ('application_status', 'open'),
    ('maintenance_mode', 'false')
ON CONFLICT (setting_key) DO NOTHING;

-- ==========================================
-- TRIGGER FOR UPDATED_AT
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
 $$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
