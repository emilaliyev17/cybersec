import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { useAuth } from '../context/AuthContext';
import TrainingViewer from './TrainingViewer';
import VideoTraining from './VideoTraining';
import Quiz from './Quiz';
import UserChecklists from './UserChecklists';
import BioEditor from './BioEditor';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizEligibility, setQuizEligibility] = useState(null);
  const [userTrack, setUserTrack] = useState(null);
  const [bioStatus, setBioStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [checklistStats, setChecklistStats] = useState({ total: 0, completed: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modulesRes, eligibilityRes, trackRes, bioStatusRes, checklistsRes] = await Promise.all([
        axios.get(apiUrl('/api/modules')),
        axios.get(apiUrl('/api/quiz/can-take')),
        axios.get(apiUrl('/api/tracks/my-track')),
        axios.get(apiUrl('/api/bio/status')).catch(() => ({ data: { isComplete: false, hasStarted: false } })),
        axios.get(apiUrl('/api/v2/checklists/my')).catch(() => ({ data: { checklists: [] } })),
      ]);
      setModules(modulesRes.data.modules);
      setQuizEligibility(eligibilityRes.data);
      setUserTrack(trackRes.data.track);
      setBioStatus(bioStatusRes.data);
      
      // Calculate checklist stats
      const checklists = checklistsRes.data.checklists || [];
      const totalItems = checklists.reduce((sum, c) => sum + parseInt(c.total_items || 0), 0);
      const completedItems = checklists.reduce((sum, c) => sum + parseInt(c.completed_items || 0), 0);
      setChecklistStats({ total: totalItems, completed: completedItems, count: checklists.length });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleModuleComplete = () => {
    setSelectedModuleId(null);
    fetchData();
    refreshUser();
  };

  const handleQuizComplete = (result) => {
    setShowQuiz(false);
    fetchData();
    refreshUser();
  };

  const completedModules = modules.filter((m) => m.is_completed).length;
  const totalModules = modules.length;
  const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const checklistProgress = checklistStats.total > 0 ? Math.round((checklistStats.completed / checklistStats.total) * 100) : 0;

  // Get selected module to determine type
  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const isVideoModule = selectedModule?.content_json?.type === 'video';

  // Navigation tabs
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'onboarding', label: 'Onboarding', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id: 'training', label: 'Security Training', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'bio', label: 'Update Bio', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  // Sidebar dimensions
  const sidebarCollapsed = 72;
  const sidebarExpanded = 240;

  // View Routing for modules/quiz
  if (selectedModuleId) {
    return (
      <div className="min-h-screen bg-dark-900">
        {isVideoModule ? (
          <VideoTraining
            moduleId={selectedModuleId}
            onComplete={handleModuleComplete}
            onBack={() => setSelectedModuleId(null)}
          />
        ) : (
          <TrainingViewer
            moduleId={selectedModuleId}
            onComplete={handleModuleComplete}
            onBack={() => setSelectedModuleId(null)}
          />
        )}
      </div>
    );
  }

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Quiz onComplete={handleQuizComplete} onBack={() => setShowQuiz(false)} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-nano-blue/10 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-nano-purple/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />
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
            className="w-10 h-10 bg-gradient-to-r from-nano-blue to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-nano-blue/20 flex-shrink-0"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </motion.div>
          <motion.div
            animate={{ opacity: sidebarHovered ? 1 : 0, x: sidebarHovered ? 0 : -10 }}
            transition={{ duration: 0.2 }}
            className="ml-3 overflow-hidden whitespace-nowrap"
          >
            <h1 className="text-base font-bold text-white">Employee Portal</h1>
            <p className="text-[10px] text-nano-blue font-medium uppercase tracking-wider">Security & Onboarding</p>
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
                  ? 'bg-nano-blue text-white shadow-lg shadow-nano-blue/20'
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nano-blue to-cyan-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <motion.div
              animate={{ opacity: sidebarHovered ? 1 : 0, x: sidebarHovered ? 0 : -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden"
            >
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </motion.div>
            <motion.button
              animate={{ opacity: sidebarHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0"
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
              {activeTab === 'overview' && 'Your progress dashboard'}
              {activeTab === 'onboarding' && 'Complete your onboarding tasks'}
              {activeTab === 'training' && 'Security training modules'}
              {activeTab === 'bio' && 'Update your profile information'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.is_certified ? 'Certified' : 'In Training'}</p>
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        <div className="md:hidden px-4 py-3 border-b border-white/5 overflow-x-auto">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-nano-blue text-white'
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <OverviewSection
              user={user}
              progressPercentage={progressPercentage}
              completedModules={completedModules}
              totalModules={totalModules}
              checklistProgress={checklistProgress}
              checklistStats={checklistStats}
              quizEligibility={quizEligibility}
              bioStatus={bioStatus}
              onStartQuiz={() => setShowQuiz(true)}
              onNavigate={setActiveTab}
            />
          )}

          {/* Onboarding Tab */}
          {activeTab === 'onboarding' && (
            <div className="space-y-6">
              <UserChecklists />
            </div>
          )}

          {/* Security Training Tab */}
          {activeTab === 'training' && (
            <SecurityTrainingSection
              modules={modules}
              user={user}
              quizEligibility={quizEligibility}
              completedModules={completedModules}
              totalModules={totalModules}
              progressPercentage={progressPercentage}
              onSelectModule={setSelectedModuleId}
              onStartQuiz={() => setShowQuiz(true)}
            />
          )}

          {/* Bio Tab */}
          {activeTab === 'bio' && (
            <div className="max-w-2xl">
              <BioEditor
                onComplete={fetchData}
                onClose={() => setActiveTab('overview')}
              />
            </div>
          )}
        </main>
      </motion.div>
    </div>
  );
}

// Overview Section Component - Bento Style
function OverviewSection({ user, progressPercentage, completedModules, totalModules, checklistProgress, checklistStats, quizEligibility, bioStatus, onStartQuiz, onNavigate }) {
  // Calculate overall progress
  const overallProgress = Math.round((progressPercentage + checklistProgress) / 2);
  
  // Task checklist items
  const tasks = [
    { 
      id: 1, 
      label: 'Complete your profile bio', 
      completed: bioStatus?.isComplete,
      action: () => onNavigate('bio'),
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    },
    { 
      id: 2, 
      label: 'Finish onboarding checklists', 
      completed: checklistProgress === 100,
      action: () => onNavigate('onboarding'),
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
    },
    { 
      id: 3, 
      label: 'Complete security training modules', 
      completed: progressPercentage === 100,
      action: () => onNavigate('training'),
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
    },
    { 
      id: 4, 
      label: 'Pass the security assessment', 
      completed: user?.is_certified,
      action: quizEligibility?.canTakeQuiz ? onStartQuiz : () => onNavigate('training'),
      icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
    },
  ];

  const completedTasks = tasks.filter(t => t.completed).length;

  return (
    <div className="space-y-6">
      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Hero Card - Overall Progress (2x2) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 lg:row-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600/20 via-blue-600/10 to-indigo-600/5 border border-white/10 p-8 hover:scale-[1.01] hover:border-white/20 transition-all duration-300 group"
        >
          {/* Glow effects */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/30 rounded-full blur-3xl group-hover:bg-cyan-500/40 transition-all duration-500" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Welcome back, {user?.name?.split(' ')[0]}!</h3>
                <p className="text-sm text-gray-400">Your onboarding progress</p>
              </div>
            </div>
            
            <div className="mb-6">
              <span className={`text-7xl font-bold tracking-tight ${overallProgress >= 80 ? 'text-emerald-400' : overallProgress >= 50 ? 'text-amber-400' : 'text-cyan-400'}`}>
                {overallProgress}%
              </span>
              <p className="text-gray-400 mt-2">Overall completion</p>
            </div>
            
            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-2xl font-bold text-white">{completedTasks}/{tasks.length}</p>
                <p className="text-xs text-gray-400">Tasks completed</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-2xl font-bold text-white">{user?.is_certified ? 'Yes' : 'No'}</p>
                <p className="text-xs text-gray-400">Certified</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Training Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => onNavigate('training')}
          className="rounded-3xl bg-gradient-to-br from-violet-600/10 to-purple-600/5 border border-white/10 p-6 hover:scale-[1.02] hover:border-white/20 transition-all duration-300 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-white mb-1">{progressPercentage}%</p>
          <p className="text-sm text-gray-400">Security Training</p>
          <p className="text-xs text-gray-500 mt-1">{completedModules}/{totalModules} modules</p>
        </motion.div>

        {/* Onboarding Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onNavigate('onboarding')}
          className="rounded-3xl bg-gradient-to-br from-emerald-600/10 to-green-600/5 border border-white/10 p-6 hover:scale-[1.02] hover:border-white/20 transition-all duration-300 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-white mb-1">{checklistProgress}%</p>
          <p className="text-sm text-gray-400">Onboarding</p>
          <p className="text-xs text-gray-500 mt-1">{checklistStats.completed}/{checklistStats.total} items</p>
        </motion.div>

        {/* Certification Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl bg-gradient-to-br from-amber-600/10 to-orange-600/5 border border-white/10 p-6 hover:scale-[1.02] hover:border-white/20 transition-all duration-300 group"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${user?.is_certified ? 'bg-gradient-to-br from-emerald-500 to-green-500 shadow-emerald-500/20' : 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20'}`}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {user?.is_certified ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
          </div>
          <p className={`text-2xl font-bold mb-1 ${user?.is_certified ? 'text-emerald-400' : 'text-amber-400'}`}>
            {user?.is_certified ? 'Certified' : 'Pending'}
          </p>
          <p className="text-sm text-gray-400">Status</p>
        </motion.div>

        {/* Bio Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => onNavigate('bio')}
          className="rounded-3xl bg-gradient-to-br from-pink-600/10 to-rose-600/5 border border-white/10 p-6 hover:scale-[1.02] hover:border-white/20 transition-all duration-300 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4 shadow-lg shadow-pink-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className={`text-2xl font-bold mb-1 ${bioStatus?.isComplete ? 'text-emerald-400' : 'text-pink-400'}`}>
            {bioStatus?.isComplete ? 'Complete' : 'Pending'}
          </p>
          <p className="text-sm text-gray-400">Profile Bio</p>
        </motion.div>
      </div>

      {/* Task Checklist Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-3xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-white/10 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Your Tasks</h3>
            <p className="text-sm text-gray-400">Complete these to finish your onboarding</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{completedTasks}/{tasks.length}</p>
            <p className="text-xs text-gray-500">completed</p>
          </div>
        </div>

        <div className="space-y-3">
          {tasks.map((task, index) => (
            <motion.button
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              onClick={task.action}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${
                task.completed
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                task.completed
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-white/10 text-gray-400'
              }`}>
                {task.completed ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={task.icon} />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                  {task.label}
                </p>
              </div>
              {!task.completed && (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Security Training Section Component
function SecurityTrainingSection({ modules, user, quizEligibility, completedModules, totalModules, progressPercentage, onSelectModule, onStartQuiz }) {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-violet-600/10 to-purple-600/5 border border-white/10 p-6"
        >
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Training Progress</h3>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-5xl font-bold text-white">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full"
            />
          </div>
          <p className="text-xs text-gray-500">{completedModules} of {totalModules} modules</p>
        </motion.div>

        {/* Certification Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-gradient-to-br from-emerald-600/10 to-green-600/5 border border-white/10 p-6"
        >
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Certification</h3>
          <p className={`text-3xl font-bold ${user?.is_certified ? 'text-emerald-400' : 'text-amber-400'}`}>
            {user?.is_certified ? 'Certified' : 'In Progress'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {user?.is_certified ? `Issued ${new Date(user.certification_date).toLocaleDateString()}` : 'Complete modules to unlock'}
          </p>
        </motion.div>

        {/* Assessment Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-3xl border p-6 ${quizEligibility?.canTakeQuiz ? 'bg-gradient-to-br from-cyan-600/10 to-blue-600/5 border-cyan-500/30' : 'bg-white/5 border-white/10'}`}
        >
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Final Assessment</h3>
          <p className={`text-2xl font-bold ${quizEligibility?.canTakeQuiz ? 'text-cyan-400' : 'text-gray-500'}`}>
            {quizEligibility?.canTakeQuiz ? 'Ready' : 'Locked'}
          </p>
          {quizEligibility?.canTakeQuiz && !user?.is_certified && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStartQuiz}
              className="mt-4 w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-sm"
            >
              Begin Assessment
            </motion.button>
          )}
          {user?.is_certified && (
            <div className="mt-4 py-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl text-center text-sm font-bold">
              Passed
            </div>
          )}
        </motion.div>
      </div>

      {/* Modules Grid */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Training Materials</h3>
        <p className="text-gray-400 mb-6">Review all presentations to unlock the assessment</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className={`rounded-3xl border p-6 transition-all hover:scale-[1.01] cursor-pointer ${
                module.is_completed
                  ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
              onClick={() => onSelectModule(module.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                    module.is_completed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {module.is_completed ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{module.title}</h4>
                    <p className="text-xs text-gray-500">Presentation</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  module.is_completed
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/10 text-gray-400'
                }`}>
                  {module.is_completed ? 'Reviewed' : 'Pending'}
                </span>
              </div>
              <p className="text-sm text-gray-400 line-clamp-2">{module.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
