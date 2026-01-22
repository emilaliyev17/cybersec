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

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-nano-purple/10 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-nano-blue/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />
      </div>

      {/* Navigation Header */}
      <nav className="glass-card mb-6 mx-2 mt-2 !rounded-2xl sticky top-2 z-50">
        <div className="px-4">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 bg-gradient-to-r from-nano-purple to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-nano-purple/20"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-wide">Admin Panel</h1>
                  <p className="text-xs text-nano-purple font-medium uppercase tracking-wider">HR Management</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="hidden md:flex items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-nano-purple text-white shadow-lg shadow-nano-purple/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{user?.name}</p>
                <p className="text-xs text-nano-purple">{user?.role}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Tabs */}
      <div className="md:hidden px-2 mb-4">
        <div className="glass-card p-2 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-nano-purple text-white'
                  : 'text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="px-2 pb-8">
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
    </div>
  );
}

// Overview Component
function Overview({ stats, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-purple"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.total_users || 0,
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      color: 'nano-blue',
    },
    {
      label: 'Certified Users',
      value: stats?.certified_users || 0,
      icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
      color: 'banano-green',
    },
    {
      label: 'Full Track',
      value: stats?.full_track_users || 0,
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'nano-blue',
      subtitle: 'New Employees',
    },
    {
      label: 'Condensed Track',
      value: stats?.condensed_track_users || 0,
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      color: 'nano-purple',
      subtitle: 'Existing Employees',
    },
  ];

  const passRate = stats?.total_quiz_attempts > 0
    ? Math.round((stats.passed_attempts / stats.total_quiz_attempts) * 100)
    : 0;

  const certRate = stats?.total_users > 0
    ? Math.round((stats.certified_users / stats.total_users) * 100)
    : 0;

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 group hover:bg-white/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}/20 flex items-center justify-center`}>
                <svg className={`w-6 h-6 text-${stat.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4">Quiz Pass Rate</h3>
          <div className="flex items-end gap-4 mb-4">
            <span className={`text-5xl font-bold ${passRate >= 80 ? 'text-banano-green' : passRate >= 50 ? 'text-banano-yellow' : 'text-red-500'}`}>
              {passRate}%
            </span>
            <span className="text-gray-400 mb-1">of attempts passed</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${passRate >= 80 ? 'bg-banano-green' : passRate >= 50 ? 'bg-banano-yellow' : 'bg-red-500'}`}
              style={{ width: `${passRate}%` }}
            />
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-500">
            <span>{stats?.passed_attempts || 0} passed</span>
            <span>{(stats?.total_quiz_attempts || 0) - (stats?.passed_attempts || 0)} failed</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4">Certification Rate</h3>
          <div className="flex items-end gap-4 mb-4">
            <span className={`text-5xl font-bold ${certRate >= 80 ? 'text-banano-green' : certRate >= 50 ? 'text-banano-yellow' : 'text-red-500'}`}>
              {certRate}%
            </span>
            <span className="text-gray-400 mb-1">of users certified</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${certRate >= 80 ? 'bg-banano-green' : certRate >= 50 ? 'bg-banano-yellow' : 'bg-red-500'}`}
              style={{ width: `${certRate}%` }}
            />
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-500">
            <span>{stats?.certified_users || 0} certified</span>
            <span>{(stats?.total_users || 0) - (stats?.certified_users || 0)} pending</span>
          </div>
        </motion.div>
      </div>

      {/* Average Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Average Quiz Score</h3>
            <p className="text-gray-400">Across all attempts</p>
          </div>
          <div className="text-right">
            <span className="text-5xl font-bold text-nano-blue">
              {stats?.average_score ? Math.round(parseFloat(stats.average_score)) : 0}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Onboarding Progress Widget */}
      <OnboardingProgressWidget />
    </>
  );
}
