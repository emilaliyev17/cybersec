import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import Intro from './components/Intro';

export default function App() {
  const { user, isAuthenticated, loading } = useAuth();
  const [showIntro, setShowIntro] = useState(true);

  // During the intro, we are effectively "loading" from the user's perspective.
  // Once intro is done, if we are still strictly loading data, we might show a spinner,
  // but usually auth check is fast.
  if (showIntro) {
    return <Intro onComplete={() => setShowIntro(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-blue mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Show admin panel for admin/manager roles
  if (user?.role === 'admin' || user?.role === 'manager') {
    return <AdminDashboard />;
  }

  return <Dashboard />;
}
