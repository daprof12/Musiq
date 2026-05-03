import { useEffect, useState } from 'react';
import { Heart, Play, Music, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { usePlayerStore } from '../store/usePlayerStore';

interface Track {
  id: string;
  title: string;
  artist_name: string;
  album_name: string;
  audio_url: string;
  cover_url: string;
}

const LikedSongs = () => {
  const { user } = useAuth();
  const { setTrack } = usePlayerStore();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLikedSongs = async () => {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          track_id,
          tracks (
            id,
            title,
            artist_name,
            album_name,
            audio_url,
            cover_url
          )
        `)
        .eq('user_id', user.id);
      
      if (data) {
        setTracks(data.map((item: any) => item.tracks));
      }
      setLoading(false);
    };

    fetchLikedSongs();
  }, [user]);

  if (!user) {
    return (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <h2>Please log in to see your liked songs</h2>
        </div>
    );
  }

  return (
    <div>
      <header style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: '24px', 
        marginBottom: '32px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
        padding: '32px',
        borderRadius: '12px'
      }}>
        <div style={{ 
            width: '232px', 
            height: '232px', 
            background: 'linear-gradient(135deg, #450af5, #c4efd9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            borderRadius: '4px'
        }}>
            <Heart size={80} fill="white" color="white" />
        </div>
        <div>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Playlist</span>
            <h1 style={{ fontSize: '72px', margin: '8px 0', fontWeight: '900' }}>Liked Songs</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
                <span>{user.email}</span>
                <span style={{ color: '#a7a7a7' }}>• {tracks.length} songs</span>
            </div>
        </div>
      </header>

      <div className="track-list" style={{ padding: '0 32px' }}>
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '40px 1fr 1fr 1fr 40px', 
            gap: '16px', 
            color: '#a7a7a7',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '8px',
            marginBottom: '16px',
            fontSize: '12px',
            textTransform: 'uppercase'
        }}>
            <span>#</span>
            <span>Title</span>
            <span>Album</span>
            <span>Date Added</span>
            <Clock size={16} />
        </div>

        {loading ? (
            <p>Loading your favorite music...</p>
        ) : tracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#a7a7a7' }}>Your liked songs will appear here.</p>
            </div>
        ) : (
            tracks.map((track, index) => (
                <div 
                  key={track.id}
                  onClick={() => setTrack({
                    id: track.id,
                    title: track.title,
                    artist: track.artist_name,
                    audio_url: track.audio_url,
                    cover_url: track.cover_url
                  })}
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '40px 1fr 1fr 1fr 40px', 
                    gap: '16px', 
                    alignItems: 'center',
                    padding: '8px 0',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <span style={{ color: '#a7a7a7', fontSize: '14px' }}>{index + 1}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: `url(${track.cover_url})`, backgroundSize: 'cover', borderRadius: '4px' }}></div>
                        <div>
                            <div style={{ fontWeight: '600' }}>{track.title}</div>
                            <div style={{ fontSize: '12px', color: '#a7a7a7' }}>{track.artist_name}</div>
                        </div>
                    </div>
                    <span style={{ color: '#a7a7a7', fontSize: '14px' }}>{track.album_name}</span>
                    <span style={{ color: '#a7a7a7', fontSize: '14px' }}>Just now</span>
                    <Heart size={16} color="#1ed760" fill="#1ed760" />
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default LikedSongs;
