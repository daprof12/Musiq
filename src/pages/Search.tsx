import { useState, useEffect } from 'react';
import { Search as SearchIcon, Play, Music, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { usePlayerStore } from '../store/usePlayerStore';
import { useToastStore } from '../store/useToastStore';

interface Track {
  id: string;
  title: string;
  artist_name: string;
  album_name: string;
  audio_url: string;
  cover_url: string;
}

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { setTrack } = usePlayerStore();
  const { addToast } = useToastStore();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      supabase.from('playlists').select('id, name').eq('user_id', user.id)
        .then(({ data }) => data && setPlaylists(data));
    }
  }, [user]);

  const addToPlaylist = async (trackId: string, playlistId: string) => {
    const { error } = await supabase
      .from('playlist_tracks')
      .insert([{ playlist_id: playlistId, track_id: trackId }]);
    
    if (error) {
      addToast('Failed to add track to playlist', 'error');
    } else {
      addToast('Added to playlist!');
    }
    setActiveMenu(null);
  };

  useEffect(() => {
    const searchTracks = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from('tracks')
        .select('*')
        .or(`title.ilike.%${query}%,artist_name.ilike.%${query}%,album_name.ilike.%${query}%`)
        .limit(20);
      
      if (data) setResults(data);
      setLoading(false);
    };

    const timer = setTimeout(searchTracks, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '40px' }}>
        <SearchIcon 
          size={20} 
          style={{ position: 'absolute', left: '16px', top: '14px', color: '#a7a7a7' }} 
        />
        <input 
          style={{ 
            paddingLeft: '48px', 
            borderRadius: '500px', 
            background: 'rgba(255,255,255,0.1)',
            height: '48px',
            fontSize: '14px'
          }}
          placeholder="What do you want to listen to?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <section>
        <h2>{query ? `Search results for "${query}"` : 'Recent Searches'}</h2>
        
        <div style={{ marginTop: '24px' }}>
          {loading ? (
            <p style={{ color: '#a7a7a7' }}>Searching...</p>
          ) : results.length === 0 && query ? (
            <p style={{ color: '#a7a7a7' }}>No results found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.map((track) => (
                <div 
                  key={track.id}
                  className="glass"
                  onClick={() => setTrack({
                    id: track.id,
                    title: track.title,
                    artist: track.artist_name,
                    audio_url: track.audio_url,
                    cover_url: track.cover_url
                  })}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '8px 16px', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    background: track.cover_url ? `url(${track.cover_url})` : '#282828',
                    backgroundSize: 'cover',
                    borderRadius: '4px',
                    marginRight: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {!track.cover_url && <Music size={20} color="#a7a7a7" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600' }}>{track.title}</div>
                    <div style={{ fontSize: '12px', color: '#a7a7a7' }}>{track.artist_name}</div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#a7a7a7', marginRight: '24px' }}>{track.album_name}</div>
                  
                  {user && (
                    <div style={{ position: 'relative', marginRight: '24px' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === track.id ? null : track.id);
                        }}
                        style={{ background: 'none', border: 'none', color: '#a7a7a7', cursor: 'pointer', padding: '4px' }}
                      >
                        <Plus size={20} />
                      </button>
                      
                      {activeMenu === track.id && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '100%', 
                          right: 0, 
                          background: '#282828', 
                          borderRadius: '4px', 
                          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                          zIndex: 10,
                          minWidth: '160px',
                          padding: '4px 0'
                        }}>
                          {playlists.map(p => (
                            <button 
                              key={p.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                addToPlaylist(track.id, p.id);
                              }}
                              style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', color: 'white', fontSize: '14px', cursor: 'pointer' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              {p.name}
                            </button>
                          ))}
                          {playlists.length === 0 && (
                            <div style={{ padding: '8px 12px', fontSize: '12px', color: '#a7a7a7' }}>No playlists</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Play size={16} color="#1ed760" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Search;
