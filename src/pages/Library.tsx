import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Music, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Playlist {
  id: string;
  name: string;
  cover_url: string;
}

const Library = () => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLibrary = async () => {
      const { data } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id);
      
      if (data) setPlaylists(data);
      setLoading(false);
    };

    fetchLibrary();
  }, [user]);

  if (!user) {
    return (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <h2>Please log in to view your library</h2>
            <Link to="/login" className="btn-primary" style={{ display: 'inline-block', marginTop: '24px' }}>Log In</Link>
        </div>
    );
  }

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1>Your Library</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
        {/* Liked Songs Shortcut */}
        <Link 
            to="/library/liked"
            className="glass"
            style={{ 
                gridColumn: 'span 2',
                background: 'linear-gradient(135deg, #450af5, #c4efd9)',
                padding: '24px',
                borderRadius: '12px',
                textDecoration: 'none',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                height: '240px',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Heart size={48} fill="white" style={{ position: 'absolute', top: '24px', left: '24px' }} />
            <div>
                <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0' }}>Liked Songs</h2>
                <p style={{ margin: 0, fontWeight: '600' }}>Your favorite tracks</p>
            </div>
        </Link>

        {/* Playlists */}
        {playlists.map((playlist) => (
            <Link 
                key={playlist.id}
                to={`/playlist/${playlist.id}`}
                className="glass"
                style={{ 
                    padding: '16px', 
                    borderRadius: '8px', 
                    transition: 'background 0.3s',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    color: 'white',
                    display: 'block'
                }}
            >
                <div style={{ 
                  width: '100%', 
                  aspectRatio: '1', 
                  background: playlist.cover_url ? `url(${playlist.cover_url})` : '#282828', 
                  backgroundSize: 'cover',
                  borderRadius: '4px', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                    {!playlist.cover_url && <Music size={48} color="#a7a7a7" />}
                </div>
                <div style={{ fontWeight: '700', marginBottom: '8px' }}>{playlist.name}</div>
                <div style={{ fontSize: '14px', color: '#a7a7a7' }}>Playlist • {user.email?.split('@')[0]}</div>
            </Link>
        ))}

        {playlists.length === 0 && !loading && (
            <div className="glass" style={{ padding: '24px', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <Music size={48} color="#282828" />
                <p style={{ color: '#a7a7a7' }}>Create your first playlist to get started.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Library;
