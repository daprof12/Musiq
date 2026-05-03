import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        }
      }
    });

    if (error) {
      setError(error.message);
    } else {
      alert('Registration successful! Please check your email for confirmation.');
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(to bottom, #1a1a1a, #000000)'
    }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '40px', borderRadius: '16px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>Sign up for free</h1>
        
        {error && <div style={{ color: '#ff4444', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Username</label>
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Email</label>
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Password</label>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button className="btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        
        <div style={{ marginTop: '32px', textAlign: 'center', color: '#a7a7a7', fontSize: '14px' }}>
          Already have an account? <Link to="/login" style={{ color: 'white', fontWeight: '700' }}>Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
