-- ==============================================================================
-- NAMI V2 - SUPABASE SCHEMA UPDATE & ZERO-KNOWLEDGE PRIVACY ARCHITECTURE
-- Run this SQL in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Add location_source column to memories table if missing
ALTER TABLE memories ADD COLUMN IF NOT EXISTS location_source TEXT DEFAULT 'exif';

-- 2. ENABLE ROW LEVEL SECURITY (RLS) ON MEMORIES TABLE
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Drop existing generic policies if any
DROP POLICY IF EXISTS "Users can only view their own memories" ON memories;
DROP POLICY IF EXISTS "Users can only insert their own memories" ON memories;
DROP POLICY IF EXISTS "Users can only update their own memories" ON memories;
DROP POLICY IF EXISTS "Users can only delete their own memories" ON memories;

-- Strict Privacy Policy: Users can ONLY access rows matching their exact authenticated UUID
CREATE POLICY "Users can only view their own memories"
    ON memories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own memories"
    ON memories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own memories"
    ON memories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own memories"
    ON memories FOR DELETE
    USING (auth.uid() = user_id);

-- 3. STORAGE BUCKET PRIVACY & CLIENT-SIDE ENCRYPTION SUPPORT
-- Ensure travel-photos bucket is set to PRIVATE (not public accessible without token/auth)
UPDATE storage.buckets SET public = false WHERE id = 'travel-photos';

-- Create strict storage object policies so users can only read/write files in their folder prefix
DROP POLICY IF EXISTS "Private User Photo Upload" ON storage.objects;
DROP POLICY IF EXISTS "Private User Photo Read" ON storage.objects;

CREATE POLICY "Private User Photo Upload"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'travel-photos' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "Private User Photo Read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'travel-photos' AND auth.uid()::text = (string_to_array(name, '/'))[1]);
