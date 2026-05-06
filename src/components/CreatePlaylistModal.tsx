import { useState } from 'react';
import { X, Music } from 'lucide-react';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  loading: boolean;
}

const CreatePlaylistModal = ({ isOpen, onClose, onCreate, loading }: CreatePlaylistModalProps) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div 
        className="glass"
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#282828',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Create Playlist</h2>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#a7a7a7', cursor: 'pointer', padding: '4px' }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ 
              width: '160px', 
              height: '160px', 
              background: '#333', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
            }}>
              <Music size={64} color="#555" />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#a7a7a7', textTransform: 'uppercase' }}>Name</label>
              <input 
                autoFocus
                placeholder="My New Playlist"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '12px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-primary"
              style={{ width: 'auto', minWidth: '100px', opacity: (loading || !name.trim()) ? 0.5 : 1 }}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlaylistModal;
