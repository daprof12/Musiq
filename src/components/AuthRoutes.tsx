import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export const AdminRoute = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Verifying admin access...</div>;
  
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
};
