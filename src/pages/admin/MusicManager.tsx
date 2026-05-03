import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Edit2, Music as MusicIcon, X, Upload, Loader2 } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist_name: string;
  album_name: string;
  genre: string;
  audio_url: string;
  cover_url: string;
}

const MusicManager = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist_name: '',
    album_name: '',
    genre: '',
    audio_url: '',
    cover_url: ''
  });

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setTracks(data);
    setLoading(false);
  };

  const uploadFile = async (file: File, bucket: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'audio_url' | 'cover_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const bucket = field === 'audio_url' ? 'music' : 'covers';
      const url = await uploadFile(file, bucket);
      setFormData(prev => ({ ...prev, [field]: url }));
    } catch (error: any) {
      alert('Error uploading file: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingTrack) {
      await supabase.from('tracks').update(formData).eq('id', editingTrack.id);
    } else {
      await supabase.from('tracks').insert([formData]);
    }

    setIsModalOpen(false);
    setEditingTrack(null);
    setFormData({ title: '', artist_name: '', album_name: '', genre: '', audio_url: '', cover_url: '' });
    fetchTracks();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this track?')) {
      await supabase.from('tracks').delete().eq('id', id);
      fetchTracks();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2>Track Management</h2>
        <button 
          className="btn-primary" 
          onClick={() => {
            setEditingTrack(null);
            setFormData({ title: '', artist_name: '', album_name: '', genre: '', audio_url: '', cover_url: '' });
            setIsModalOpen(true);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={20} /> Add New Track
        </button>
      </div>

      <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)', color: '#a7a7a7', fontSize: '12px', textTransform: 'uppercase' }}>
            <tr>
              <th style={{ padding: '16px' }}>Track</th>
              <th style={{ padding: '16px' }}>Artist</th>
              <th style={{ padding: '16px' }}>Album</th>
              <th style={{ padding: '16px' }}>Genre</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !tracks.length ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>Loading tracks...</td></tr>
            ) : tracks.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>No tracks found. Add your first one!</td></tr>
            ) : (
              tracks.map((track) => (
                <tr key={track.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: track.cover_url ? `url(${track.cover_url})` : '#282828',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '4px' 
                      }}>
                        {!track.cover_url && <MusicIcon size={20} style={{ margin: '10px' }} />}
                      </div>
                      <span style={{ fontWeight: '600' }}>{track.title}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>{track.artist_name || 'Various'}</td>
                  <td style={{ padding: '16px' }}>{track.album_name}</td>
                  <td style={{ padding: '16px' }}><span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}>{track.genre}</span></td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => {
                          setEditingTrack(track);
                          setFormData({ 
                            title: track.title, 
                            artist_name: track.artist_name, 
                            album_name: track.album_name, 
                            genre: track.genre, 
                            audio_url: track.audio_url, 
                            cover_url: track.cover_url 
                          });
                          setIsModalOpen(true);
                        }}
                        style={{ background: 'none', border: 'none', color: '#a7a7a7', cursor: 'pointer' }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(track.id)}
                        style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '32px', borderRadius: '16px', position: 'relative' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#a7a7a7', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '24px' }}>{editingTrack ? 'Edit Track' : 'Add New Track'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                placeholder="Track Title" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required 
              />
              <input 
                placeholder="Artist Name" 
                value={formData.artist_name} 
                onChange={e => setFormData({...formData, artist_name: e.target.value})} 
              />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input 
                  placeholder="Album Name" 
                  value={formData.album_name} 
                  onChange={e => setFormData({...formData, album_name: e.target.value})} 
                />
                <input 
                  placeholder="Genre" 
                  value={formData.genre} 
                  onChange={e => setFormData({...formData, genre: e.target.value})} 
                />
              </div>

              <div style={{ border: '1px dashed rgba(255,255,255,0.2)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    {uploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                    <span style={{ fontSize: '14px' }}>{formData.audio_url ? 'Audio uploaded ✅' : 'Upload Audio File (MP3)'}</span>
                    <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'audio_url')} style={{ display: 'none' }} />
                </label>
              </div>

              <div style={{ border: '1px dashed rgba(255,255,255,0.2)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Upload size={24} />
                    <span style={{ fontSize: '14px' }}>{formData.cover_url ? 'Cover uploaded ✅' : 'Upload Cover Image'}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover_url')} style={{ display: 'none' }} />
                </label>
              </div>

              <button className="btn-primary" style={{ marginTop: '12px' }} disabled={loading || uploading}>
                {loading ? 'Saving...' : 'Save Track'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MusicManager;
