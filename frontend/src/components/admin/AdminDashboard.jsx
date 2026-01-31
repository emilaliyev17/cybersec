import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import UserManagement from './UserManagement';
import ModuleEditor from './ModuleEditor';
import QuizResults from './QuizResults';
import QuestionEditor from './QuestionEditor';
import TrackManagement from './TrackManagement';
import ChecklistManagement from './ChecklistManagement';
import OnboardingProgressWidget from './OnboardingProgressWidget';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarHovered, setSidebarHovered] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(apiUrl('/api/admin/stats'));
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'checklists', label: 'Checklists', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id: 'tracks', label: 'Tracks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: 'modules', label: 'Modules', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'questions', label: 'Questions', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'quiz', label: 'Quiz Results', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  ];

  // Sidebar width values
  const sidebarCollapsed = 72;
  const sidebarExpanded = 256;

  return (
    <div className="min-h-screen relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-nano-purple/10 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-nano-blue/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />
      </div>

      {/* Sidebar - Google Console Style */}
      <motion.aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        animate={{ width: sidebarHovered ? sidebarExpanded : sidebarCollapsed }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-0 h-full z-50 bg-[#0d1117]/95 backdrop-blur-xl border-r border-white/5"
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-4 border-b border-white/5">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 bg-gradient-to-r from-nano-purple to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-nano-purple/20 flex-shrink-0"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </motion.div>
          <motion.div
            animate={{ opacity: sidebarHovered ? 1 : 0, x: sidebarHovered ? 0 : -10 }}
            transition={{ duration: 0.2 }}
            className="ml-3 overflow-hidden whitespace-nowrap"
          >
            <h1 className="text-base font-bold text-white">Admin Panel</h1>
            <p className="text-[10px] text-nano-purple font-medium uppercase tracking-wider">HR Management</p>
          </motion.div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === tab.id
                  ? 'bg-nano-purple text-white shadow-lg shadow-nano-purple/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <motion.span
                animate={{ opacity: sidebarHovered ? 1 : 0, x: sidebarHovered ? 0 : -10 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                {tab.label}
              </motion.span>
            </button>
          ))}
        </nav>

        {/* User Section at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nano-purple to-pink-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <motion.div
              animate={{ opacity: sidebarHovered ? 1 : 0, x: sidebarHovered ? 0 : -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden"
            >
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role}</p>
            </motion.div>
            <motion.button
              animate={{ opacity: sidebarHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 transition-colors flex-shrink-0"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content - shifts with sidebar */}
      <motion.div
        animate={{ marginLeft: sidebarHovered ? sidebarExpanded : sidebarCollapsed }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen"
      >
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0d1117]/50 backdrop-blur-sm sticky top-0 z-40">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {tabs.find(t => t.id === activeTab)?.label || 'Overview'}
            </h2>
            <p className="text-xs text-gray-400">
              {activeTab === 'overview' && 'Dashboard overview and statistics'}
              {activeTab === 'users' && 'Manage system users'}
              {activeTab === 'checklists' && 'Manage onboarding checklists'}
              {activeTab === 'tracks' && 'Configure training tracks'}
              {activeTab === 'modules' && 'Edit training modules'}
              {activeTab === 'questions' && 'Manage quiz questions'}
              {activeTab === 'quiz' && 'View quiz results and analytics'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-nano-purple">{user?.role}</p>
            </div>
          </div>
        </header>

        {/* Mobile Tabs */}
        <div className="md:hidden px-4 py-3 border-b border-white/5">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-nano-purple text-white'
                    : 'text-gray-400 bg-white/5'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">
          {activeTab === 'overview' && (
            <Overview stats={stats} loading={loading} onRefresh={fetchStats} />
          )}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'checklists' && <ChecklistManagement />}
          {activeTab === 'tracks' && <TrackManagement />}
          {activeTab === 'modules' && <ModuleEditor />}
          {activeTab === 'questions' && <QuestionEditor />}
          {activeTab === 'quiz' && <QuizResults />}
        </main>
      </motion.div>
    </div>
  );
}

// Overview Component - Bento Grid Design
function Overview({ stats, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-purple"></div>
      </div>
    );
  }

  const passRate = stats?.total_quiz_attempts > 0
    ? Math.round((stats.passed_attempts / stats.total_quiz_attempts) * 100)
    : 0;

  const certRate = stats?.total_users > 0
    ? Math.round((stats.certified_users / stats.total_users) * 100)
    : 0;

  const avgScore = stats?.average_score ? Math.round(parseFloat(stats.average_score)) : 0;

  return (
    <div className="space-y-5">
      {/* Bento Grid - Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Hero Card - Certification Rate (2x2) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 lg:row-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-fuchsia-600/5 border border-white/10 p-8 hover:scale-[1.02] hover:border-white/20 transition-all duration-300 group"
        >
          {/* Glow effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/30 rounded-full blur-3xl group-hover:bg-violet-500/40 transition-all duration-500" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Certification Rate</h3>
                <p className="text-sm text-gray-400">Overall team progress</p>
              </div>
            </div>
            
            <div className="mb-6">
              <span className={`text-7xl font-bold tracking-tight ${certRate >= 80 ? 'text-emerald-400' : certRate >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                {certRate}%
              </span>
            </div>
            
            {/* Progress ring visual */}
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90">
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/10" />
                  <circle 
                    cx="40" cy="40" r="36" 
                    stroke="url(#certGradient)" 
                    strokeWidth="6" 
                    fill="none" 
                    strokeLinecap="round"
                    strokeDasharray={`${certRate * 2.26} 226`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="certGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{stats?.certified_users || 0}/{stats?.total_users || 0}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-sm text-gray-300">{stats?.certified_users || 0} Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                  <span className="text-sm text-gray-400">{(stats?.total_users || 0) - (stats?.certified_users || 0)} Pending</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Total Users Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-gradient-to-br from-blue-600/10 to-cyan-600/5 border border-white/10 p-6 hover:scale-[1.02] hover:border-white/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-white mb-1">{stats?.total_users || 0}</p>
          <p className="text-sm text-gray-400">Total Users</p>
        </motion.div>

        {/* Certified Users Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl bg-gradient-to-br from-emerald-600/10 to-green-600/5 border border-white/10 p-6 hover:scale-[1.02] hover:border-white/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-shadow">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-white mb-1">{stats?.certified_users || 0}</p>
          <p className="text-sm text-gray-400">Certified Users</p>
        </motion.div>

        {/* Full Track Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl bg-gradient-to-br from-sky-600/10 to-blue-600/5 border border-white/10 p-6 hover:scale-[1.02] hover:border-white/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/30 transition-shadow">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-white mb-1">{stats?.full_track_users || 0}</p>
          <p className="text-sm text-gray-400">Full Track</p>
          <p className="text-xs text-gray-500 mt-1">New Employees</p>
        </motion.div>

        {/* Condensed Track Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl bg-gradient-to-br from-purple-600/10 to-violet-600/5 border border-white/10 p-6 hover:scale-[1.02] hover:border-white/20 transition-all duration-300 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-shadow">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-white mb-1">{stats?.condensed_track_users || 0}</p>
          <p className="text-sm text-gray-400">Condensed Track</p>
          <p className="text-xs text-gray-500 mt-1">Existing Employees</p>
        </motion.div>
      </div>

      {/* Second Row - Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Quiz Pass Rate - Wide Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 rounded-3xl bg-gradient-to-r from-amber-600/10 via-orange-600/5 to-rose-600/10 border border-white/10 p-6 hover:scale-[1.01] hover:border-white/20 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Quiz Pass Rate</h3>
                <p className="text-sm text-gray-400">Success rate across all attempts</p>
              </div>
            </div>
            <span className={`text-4xl font-bold ${passRate >= 80 ? 'text-emerald-400' : passRate >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {passRate}%
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${passRate}%` }}
              transition={{ duration: 1, delay: 0.6 }}
              className={`absolute h-full rounded-full ${passRate >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : passRate >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-rose-500 to-red-400'}`}
            />
          </div>
          
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-gray-300">{stats?.passed_attempts || 0} passed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-gray-400">{(stats?.total_quiz_attempts || 0) - (stats?.passed_attempts || 0)} failed</span>
            </div>
          </div>
        </motion.div>

        {/* Average Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-3xl bg-gradient-to-br from-cyan-600/10 to-teal-600/5 border border-white/10 p-6 hover:scale-[1.02] hover:border-white/20 transition-all duration-300 relative overflow-hidden group"
        >
          {/* Decorative element */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white">Avg. Score</h3>
            </div>
            
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-cyan-400">{avgScore}</span>
              <span className="text-2xl font-bold text-cyan-400/60 mb-1">%</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">Across all attempts</p>
          </div>
        </motion.div>
      </div>

      {/* Onboarding Progress Widget */}
      <OnboardingProgressWidget />
    </div>
  );
}
