-- Create subscription tiers enum
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'artist');

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    tier subscription_tier DEFAULT 'free',
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create tracks table
CREATE TABLE IF NOT EXISTS public.tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    artist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    album_name TEXT,
    genre TEXT,
    audio_url TEXT NOT NULL,
    cover_url TEXT,
    duration INTEGER, -- in seconds
    plays_count BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products table (merch)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    artist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT,
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
    provider TEXT, -- 'stripe', 'paystack', etc.
    provider_id TEXT, -- external transaction ID
    type TEXT NOT NULL, -- 'subscription', 'merch'
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policies for tracks
CREATE POLICY "Tracks are viewable by everyone" ON public.tracks
    FOR SELECT USING (true);

CREATE POLICY "Only admins or artists can manage tracks" ON public.tracks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = true OR tier = 'artist')
        )
    );

-- Policies for products
CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Only admins or artists can manage products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = true OR tier = 'artist')
        )
    );

-- Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create playlist_tracks junction table
CREATE TABLE IF NOT EXISTS public.playlist_tracks (
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (playlist_id, track_id)
);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, track_id)
);

-- Enable RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Playlists are viewable by owner" ON public.playlists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their playlists" ON public.playlists
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Playlist tracks are viewable by owner" ON public.playlist_tracks
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can manage their playlist tracks" ON public.playlist_tracks
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can view their own likes" ON public.likes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own likes" ON public.likes
    FOR ALL USING (auth.uid() = user_id);

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
