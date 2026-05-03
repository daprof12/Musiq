-- Set up Supabase Storage for Musiq

-- 1. Create buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('music', 'music', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS for 'music' bucket
-- Allow public to read
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'music');

-- Allow admins to upload/delete
CREATE POLICY "Admin Music Management" ON storage.objects 
FOR ALL USING (
    bucket_id = 'music' AND 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
);

-- 3. Set up RLS for 'covers' bucket
-- Allow public to read
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'covers');

-- Allow admins to upload/delete
CREATE POLICY "Admin Covers Management" ON storage.objects 
FOR ALL USING (
    bucket_id = 'covers' AND 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
);
