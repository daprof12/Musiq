import { useState, useEffect } from 'react';
import { Search as SearchIcon, Play, Music } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePlayerStore } from '../store/usePlayerStore';

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
  const [loading, setLoading] = useState(false);
  const { setTrack } = usePlayerStore();

  useEffect(() => {
    const searchTracks = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
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
                  <div style={{ fontSize: '14px', color: '#a7a7a7' }}>{track.album_name}</div>
                  <Play size={16} color="#1ed760" style={{ marginLeft: '24px' }} />
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
