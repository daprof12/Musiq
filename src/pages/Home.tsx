import { useEffect, useState } from 'react';
import { Play, Plus } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToastStore } from '../store/useToastStore';

interface Track {
  id: string;
  title: string;
  artist_name: string;
  album_name: string;
  audio_url: string;
  cover_url: string;
}

const Home = () => {
  const { setTrack } = usePlayerStore();
  const { user, profile } = useAuth();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: trackData } = await supabase
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (trackData) setTracks(trackData);

      if (user) {
        const { data: playlistData } = await supabase
          .from('playlists')
          .select('id, name')
          .eq('user_id', user.id);
        if (playlistData) setPlaylists(playlistData);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const addToPlaylist = async (trackId: string, playlistId: string) => {
    const { error } = await supabase
      .from('playlist_tracks')
      .insert([{ playlist_id: playlistId, track_id: trackId }]);
    
    if (error) {
      addToast('Failed to add track to playlist', 'error');
      console.error(error);
    } else {
      addToast('Added to playlist!');
    }
    setActiveMenu(null);
  };

  return (
    <div>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Good {new Date().getHours() < 12 ? 'morning' : 'evening'}{user ? `, ${profile?.username || 'User'}` : ''}</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button 
              className="btn-primary" 
              style={{ background: 'white', color: 'black', width: 'auto', minWidth: 'fit-content' }}
              onClick={() => navigate('/subscription')}
            >
              Upgrade
            </button>
            {user ? (
                <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    background: '#282828',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#1ed760',
                    border: '1px solid #1ed760'
                }}>
                    {(profile?.username || 'U').charAt(0).toUpperCase()}
                </div>
            ) : (
                <Link to="/login" style={{ color: 'white', textDecoration: 'none', fontWeight: '700' }}>Log in</Link>
            )}
        </div>
      </header>

      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
          <h2>Recently Played</h2>
          <span style={{ color: '#a7a7a7', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Show all</span>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
          gap: '24px' 
        }}>
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} style={{ height: '240px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
            ))
          ) : tracks.length === 0 ? (
            <p style={{ color: '#a7a7a7' }}>No tracks found. Upload some in the Admin Panel!</p>
          ) : (
            tracks.map((item) => (
              <div 
                key={item.id}
                className="glass"
                onClick={() => setTrack({
                    id: item.id,
                    title: item.title,
                    artist: item.artist_name,
                    audio_url: item.audio_url,
                    cover_url: item.cover_url
                })}
                style={{ 
                  padding: '16px', 
                  borderRadius: '8px', 
                  transition: 'background 0.3s',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ 
                  width: '100%', 
                  aspectRatio: '1', 
                  background: `url(${item.cover_url})`, 
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '4px', 
                  marginBottom: '16px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                    <div style={{ fontSize: '14px', color: '#a7a7a7' }}>{item.artist_name}</div>
                  </div>
                  
                  {user && (
                    <div style={{ position: 'relative' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === item.id ? null : item.id);
                        }}
                        style={{ background: 'none', border: 'none', color: '#a7a7a7', cursor: 'pointer', padding: '4px' }}
                      >
                        <Plus size={20} />
                      </button>
                      
                      {activeMenu === item.id && (
                        <div style={{ 
                          position: 'absolute', 
                          bottom: '100%', 
                          right: 0, 
                          background: '#282828', 
                          borderRadius: '4px', 
                          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                          zIndex: 10,
                          minWidth: '160px',
                          padding: '4px 0'
                        }}>
                          <div style={{ padding: '8px 12px', fontSize: '12px', color: '#a7a7a7', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Add to playlist</div>
                          {playlists.map(p => (
                            <button 
                              key={p.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                addToPlaylist(item.id, p.id);
                              }}
                              style={{ 
                                display: 'block', 
                                width: '100%', 
                                padding: '8px 12px', 
                                textAlign: 'left', 
                                background: 'none', 
                                border: 'none', 
                                color: 'white', 
                                fontSize: '14px', 
                                cursor: 'pointer' 
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              {p.name}
                            </button>
                          ))}
                          {playlists.length === 0 && (
                            <div style={{ padding: '8px 12px', fontSize: '12px', color: '#a7a7a7' }}>No playlists found</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="play-button" style={{
                    position: 'absolute',
                    right: '24px',
                    bottom: '80px',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#1ed760',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                    opacity: 0,
                    transform: 'translateY(8px)',
                    transition: 'all 0.3s ease'
                }}>
                    <Play fill="black" size={24} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      <style>{`
          .glass:hover .play-button {
              opacity: 1;
              transform: translateY(0);
          }
      `}</style>
    </div>
  );
};

export default Home;
