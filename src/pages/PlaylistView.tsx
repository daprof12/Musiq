import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { usePlayerStore } from '../store/usePlayerStore';
import { Play, Music, Clock, Trash2, ChevronLeft } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist_name: string;
  album_name: string;
  audio_url: string;
  cover_url: string;
}

interface Playlist {
  id: string;
  name: string;
  cover_url: string;
  user_id: string;
}

const PlaylistView = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setTrack } = usePlayerStore();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;

    const fetchPlaylistData = async () => {
      setLoading(true);
      
      // Fetch playlist details
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .single();
      
      if (playlistError || !playlistData) {
        console.error('Error fetching playlist:', playlistError);
        navigate('/library');
        return;
      }
      setPlaylist(playlistData);

      // Fetch tracks in playlist
      // Assuming a many-to-many relationship via playlist_tracks
      const { data: trackData, error: trackError } = await supabase
        .from('playlist_tracks')
        .select(`
          track_id,
          tracks (*)
        `)
        .eq('playlist_id', id);
      
      if (trackError) {
        console.error('Error fetching tracks:', trackError);
      } else if (trackData) {
        setTracks(trackData.map((item: any) => item.tracks));
      }
      
      setLoading(false);
    };

    fetchPlaylistData();
  }, [id, user, navigate]);

  const handleDeletePlaylist = async () => {
    if (!playlist || !user || playlist.user_id !== user.id) return;
    if (!window.confirm(`Are you sure you want to delete "${playlist.name}"?`)) return;

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlist.id);
    
    if (error) {
      alert('Failed to delete playlist.');
    } else {
      navigate('/library');
    }
  };

  const removeFromPlaylist = async (trackId: string) => {
    if (!playlist) return;
    
    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlist.id)
      .eq('track_id', trackId);
    
    if (error) {
      alert('Failed to remove track.');
    } else {
      setTracks(tracks.filter(t => t.id !== trackId));
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading playlist...</div>;
  if (!playlist) return <div style={{ padding: '20px' }}>Playlist not found.</div>;

  return (
    <div>
      <button 
        onClick={() => navigate(-1)} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#a7a7a7', cursor: 'pointer', marginBottom: '24px' }}
      >
        <ChevronLeft size={20} />
        Back
      </button>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div style={{ 
          width: '232px', 
          height: '232px', 
          background: playlist.cover_url ? `url(${playlist.cover_url})` : '#282828', 
          backgroundSize: 'cover',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {!playlist.cover_url && <Music size={80} color="#a7a7a7" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Playlist</div>
          <h1 style={{ fontSize: '72px', fontWeight: '900', margin: '0 0 16px 0', letterSpacing: '-2px' }}>{playlist.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700' }}>
            <span>{user?.email?.split('@')[0] || 'User'}</span>
            <span style={{ color: '#a7a7a7' }}>• {tracks.length} songs</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '32px' }}>
        <button 
          style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1ed760', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
          onClick={() => tracks.length > 0 && setTrack({
            id: tracks[0].id,
            title: tracks[0].title,
            artist: tracks[0].artist_name,
            audio_url: tracks[0].audio_url,
            cover_url: tracks[0].cover_url
          })}
        >
          <Play size={24} fill="black" />
        </button>
        <button 
          onClick={handleDeletePlaylist}
          style={{ background: 'none', border: 'none', color: '#a7a7a7', cursor: 'pointer' }}
          title="Delete Playlist"
        >
          <Trash2 size={32} />
        </button>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 1fr 48px', gap: '16px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#a7a7a7', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <span>#</span>
          <span>Title</span>
          <span>Album</span>
          <Clock size={16} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
          {tracks.map((track, index) => (
            <div 
              key={track.id}
              className="track-row"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '48px 1fr 1fr 48px', 
                gap: '16px', 
                padding: '8px 16px', 
                borderRadius: '4px',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onClick={() => setTrack({
                id: track.id,
                title: track.title,
                artist: track.artist_name,
                audio_url: track.audio_url,
                cover_url: track.cover_url
              })}
            >
              <span style={{ color: '#a7a7a7' }}>{index + 1}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: `url(${track.cover_url})`, backgroundSize: 'cover', borderRadius: '4px' }} />
                <div>
                  <div style={{ color: 'white', fontWeight: '500' }}>{track.title}</div>
                  <div style={{ color: '#a7a7a7', fontSize: '13px' }}>{track.artist_name}</div>
                </div>
              </div>
              <div style={{ color: '#a7a7a7', fontSize: '14px' }}>{track.album_name}</div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromPlaylist(track.id);
                }}
                style={{ background: 'none', border: 'none', color: '#a7a7a7', cursor: 'pointer', opacity: 0 }}
                className="remove-btn"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          
          {tracks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#a7a7a7' }}>
              <Music size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
              <p>This playlist is empty.</p>
              <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/search')}>Find songs</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .track-row:hover {
          background: rgba(255,255,255,0.1);
        }
        .track-row:hover .remove-btn {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default PlaylistView;
