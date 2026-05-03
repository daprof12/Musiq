import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User as UserIcon, Shield, ShieldAlert, Plus, X, Mail, Lock, UserPlus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Note: For actual auth.users deletion, the Service Role Key is required.
// We use the anon key here for the client, but the delete button will
// attempt the deletion.
const adminClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  tier: 'free' | 'premium' | 'artist';
  is_admin: boolean;
  created_at: string;
}

const UserManager = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    isAdmin: false,
    tier: 'free' as 'free' | 'premium' | 'artist'
  });

  const [editFormData, setEditFormData] = useState({
    username: '',
    full_name: '',
    avatar_url: '',
    tier: 'free' as 'free' | 'premium' | 'artist',
    is_admin: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const { data: authData, error: authError } = await adminClient.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          username: formData.username,
        }
      }
    });

    if (authError) {
      alert(authError.message);
      setFormLoading(false);
      return;
    }

    if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
              is_admin: formData.isAdmin,
              tier: formData.tier
          })
          .eq('id', authData.user.id);
        
        if (profileError) console.error("Profile update error:", profileError);
    }

    alert('User created successfully!');
    setIsModalOpen(false);
    setFormData({ email: '', password: '', username: '', isAdmin: false, tier: 'free' });
    fetchUsers();
    setFormLoading(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setFormLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update(editFormData)
      .eq('id', editingUser.id);
    
    if (error) {
        alert(error.message);
    } else {
        setIsEditModalOpen(false);
        setEditingUser(null);
        fetchUsers();
    }
    setFormLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        setLoading(true);
        // Note: For a production app, you should call a Supabase Edge Function
        // that uses the Service Role Key to delete the user from auth.users.
        // For now, we delete from profiles.
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);
        
        if (error) {
            alert(error.message);
        } else {
            fetchUsers();
        }
        setLoading(false);
    }
  };

  const openEditModal = (user: Profile) => {
    setEditingUser(user);
    setEditFormData({
        username: user.username || '',
        full_name: user.full_name || '',
        avatar_url: user.avatar_url || '',
        tier: user.tier,
        is_admin: user.is_admin
    });
    setIsEditModalOpen(true);
  };

  return (
    <div>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h2>User Management</h2>
            <p>Manage user roles, subscription tiers, and system access.</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => setIsModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <UserPlus size={20} /> Create New User
        </button>
      </header>

      <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)', color: '#a7a7a7', fontSize: '12px', textTransform: 'uppercase' }}>
            <tr>
              <th style={{ padding: '16px' }}>User</th>
              <th style={{ padding: '16px' }}>Role</th>
              <th style={{ padding: '16px' }}>Tier</th>
              <th style={{ padding: '16px' }}>Joined</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !users.length ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>Loading users...</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: user.avatar_url ? `url(${user.avatar_url})` : '#282828',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '50%' 
                      }}>
                        {!user.avatar_url && <UserIcon size={20} style={{ margin: '10px' }} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{user.username || 'Anonymous'}</div>
                        <div style={{ fontSize: '12px', color: '#a7a7a7' }}>{user.full_name || 'No full name'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: user.is_admin ? '#ff4444' : '#a7a7a7' }}>
                        {user.is_admin ? <ShieldAlert size={16} /> : <Shield size={16} />}
                        {user.is_admin ? 'Admin' : 'User'}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                     <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', textTransform: 'capitalize' }}>
                        {user.tier}
                     </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#a7a7a7' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button 
                            onClick={() => openEditModal(user)}
                            style={{ background: 'none', border: 'none', color: '#a7a7a7', cursor: 'pointer' }}
                            title="Edit User"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button 
                            onClick={() => handleDeleteUser(user.id)}
                            style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}
                            title="Delete User"
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

      {/* Create Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '450px', padding: '32px', borderRadius: '16px', position: 'relative' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#a7a7a7', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '8px' }}>Create New User</h2>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input placeholder="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <select value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value as any})} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px' }}>
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                        <option value="artist">Artist</option>
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input type="checkbox" checked={formData.isAdmin} onChange={e => setFormData({...formData, isAdmin: e.target.checked})} />
                        <span>Admin</span>
                    </div>
                </div>
                <button className="btn-primary" disabled={formLoading}>{formLoading ? 'Creating...' : 'Create User'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '450px', padding: '32px', borderRadius: '16px', position: 'relative' }}>
            <button 
              onClick={() => setIsEditModalOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#a7a7a7', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '24px' }}>Edit User Profile</h2>
            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={{ fontSize: '12px', color: '#a7a7a7' }}>Username</label>
                    <input value={editFormData.username} onChange={e => setEditFormData({...editFormData, username: e.target.value})} required />
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#a7a7a7' }}>Full Name</label>
                    <input value={editFormData.full_name} onChange={e => setEditFormData({...editFormData, full_name: e.target.value})} />
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#a7a7a7' }}>Avatar URL</label>
                    <input value={editFormData.avatar_url} onChange={e => setEditFormData({...editFormData, avatar_url: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={{ fontSize: '12px', color: '#a7a7a7' }}>Tier</label>
                        <select value={editFormData.tier} onChange={e => setEditFormData({...editFormData, tier: e.target.value as any})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px' }}>
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                            <option value="artist">Artist</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                        <input type="checkbox" checked={editFormData.is_admin} onChange={e => setEditFormData({...editFormData, is_admin: e.target.checked})} />
                        <span>Admin Access</span>
                    </div>
                </div>
                <button className="btn-primary" disabled={formLoading} style={{ marginTop: '12px' }}>
                    {formLoading ? 'Saving...' : 'Update Profile'}
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
