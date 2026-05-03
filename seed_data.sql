-- Seed data for Musiq

-- 1. Create a dummy Artist profile if none exists (required for foreign keys)
-- Note: In a real app, this would be a real user ID.
-- We'll use a constant UUID for the seed artist.
DO $$
DECLARE
    seed_artist_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    INSERT INTO public.profiles (id, username, full_name, tier, is_admin)
    VALUES (seed_artist_id, 'musiq_records', 'Musiq Records', 'artist', true)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Seed Tracks
    INSERT INTO public.tracks (title, artist_id, album_name, genre, audio_url, cover_url)
    VALUES 
    ('Midnight City', seed_artist_id, 'Hurry Up, We''re Dreaming', 'Electronic', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop'),
    ('Starboy', seed_artist_id, 'Starboy', 'R&B', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300&h=300&fit=crop'),
    ('Blinding Lights', seed_artist_id, 'After Hours', 'Synthwave', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop'),
    ('Levitating', seed_artist_id, 'Future Nostalgia', 'Pop', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'https://images.unsplash.com/photo-1459749411177-042180ce673c?w=300&h=300&fit=crop'),
    ('Save Your Tears', seed_artist_id, 'After Hours', 'Pop', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=300&h=300&fit=crop'),
    ('Circles', seed_artist_id, 'Hollywood''s Bleeding', 'Pop Rock', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', 'https://images.unsplash.com/photo-1496293455970-f8581aae0e3c?w=300&h=300&fit=crop')
    ON CONFLICT DO NOTHING;

    -- 3. Seed Products
    INSERT INTO public.products (name, description, price, artist_id, image_url, stock_quantity)
    VALUES 
    ('Limited Edition Hoodie', 'Premium heavyweight cotton hoodie with custom artist embroidery.', 59.99, seed_artist_id, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop', 50),
    ('Vinyl Record - Collector Set', 'Special edition translucent vinyl with unreleased bonus tracks.', 34.99, seed_artist_id, 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&h=400&fit=crop', 100),
    ('Autographed Tour Poster', 'Hand-signed 24x36 poster from the 2024 global tour.', 19.99, seed_artist_id, 'https://images.unsplash.com/photo-1583244532610-2ca27017009a?w=400&h=400&fit=crop', 200),
    ('Vintage Concert T-Shirt', 'Distressed-look cotton tee featuring original tour artwork.', 29.99, seed_artist_id, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop', 75)
    ON CONFLICT DO NOTHING;
END $$;
