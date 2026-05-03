import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Home from './pages/Home';
import Store from './pages/Store';
import Subscription from './pages/Subscription';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import Search from './pages/Search';
import Library from './pages/Library';
import LikedSongs from './pages/LikedSongs';
import { ProtectedRoute, AdminRoute } from './components/AuthRoutes';

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/store" element={<Store />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected User Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/library" element={<Library />} />
            <Route path="/library/liked" element={<LikedSongs />} />
            <Route path="/checkout" element={<Checkout />} />
          </Route>

          {/* Admin Only Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </main>
      <Player />
    </div>
  );
}

export default App;
