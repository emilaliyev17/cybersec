import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { useAuth } from '../context/AuthContext';
import TrainingViewer from './TrainingViewer';
import VideoTraining from './VideoTraining';
import Quiz from './Quiz';
import OnboardingChecklist from './OnboardingChecklist';
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
  const [showBioEditor, setShowBioEditor] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modulesRes, eligibilityRes, trackRes, bioStatusRes] = await Promise.all([
        axios.get(apiUrl('/api/modules')),
        axios.get(apiUrl('/api/quiz/can-take')),
        axios.get(apiUrl('/api/tracks/my-track')),
        axios.get(apiUrl('/api/bio/status')).catch(() => ({ data: { isComplete: false, hasStarted: false } })),
      ]);
      setModules(modulesRes.data.modules);
      setQuizEligibility(eligibilityRes.data);
      setUserTrack(trackRes.data.track);
      setBioStatus(bioStatusRes.data);
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

  // Get selected module to determine type
  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const isVideoModule = selectedModule?.content_json?.type === 'video';

  // View Routing
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
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-nano-blue/10 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-nano-purple/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />
      </div>

      {/* Navigation Header */}
      <nav className="glass-card mb-8 mx-4 mt-4 !rounded-2xl sticky top-4 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.5 }}
                  className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-nano-blue/20"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-wide">Security Training</h1>
                  <p className="text-xs text-nano-blue font-medium uppercase tracking-wider">Employee Portal</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Training Progress Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-24 h-24 text-nano-blue" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>

            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Training Progress</h3>

            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-bold text-white tracking-tight">{progressPercentage}%</span>
              <span className="text-nano-blue font-medium mb-1.5">complete</span>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-2 mb-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-gradient-primary h-2 rounded-full relative"
              >
                <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] w-full" />
              </motion.div>
            </div>
            <p className="text-xs text-gray-500">
              {completedModules} of {totalModules} modules completed
            </p>
          </motion.div>

          {/* Certification Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 group"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Certification</h3>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.3)] ${user?.is_certified ? 'bg-banano-green/20 text-banano-green' : 'bg-banano-yellow/20 text-banano-yellow'
                }`}>
                {user?.is_certified ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </div>

            <div className="mb-2">
              <span className={`text-3xl font-bold ${user?.is_certified ? 'text-banano-green drop-shadow-[0_0_8px_rgba(76,191,75,0.5)]' : 'text-banano-yellow drop-shadow-[0_0_8px_rgba(251,221,17,0.5)]'}`}>
                {user?.is_certified ? 'Certified' : 'In Progress'}
              </span>
            </div>

            <p className="text-sm text-gray-500">
              {user?.is_certified
                ? `Issued on ${new Date(user.certification_date).toLocaleDateString()}`
                : 'Complete all modules to unlock exam'
              }
            </p>
          </motion.div>

          {/* Final Assessment Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`glass-card p-6 flex flex-col justify-between relative overflow-hidden ${quizEligibility?.canTakeQuiz ? 'border-nano-purple/50 shadow-[0_0_20px_rgba(124,58,237,0.15)]' : ''
              }`}
          >
            {quizEligibility?.canTakeQuiz && (
              <div className="absolute inset-0 bg-nano-purple/5 mix-blend-overlay" />
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Final Assessment</h3>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${quizEligibility?.canTakeQuiz ? 'text-white' : 'text-gray-500'}`}>
                  {quizEligibility?.canTakeQuiz ? 'Ready to Start' : 'Locked'}
                </span>
                {quizEligibility?.canTakeQuiz && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nano-purple opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-nano-purple"></span>
                  </span>
                )}
              </div>
            </div>

            {quizEligibility?.canTakeQuiz && !user?.is_certified ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowQuiz(true)}
                className="mt-6 w-full btn-neon-primary bg-gradient-to-r from-nano-purple to-pink-600"
              >
                Begin Assessment
              </motion.button>
            ) : !user?.is_certified ? (
              <div className="mt-6 w-full py-3 px-4 rounded-xl bg-white/5 border border-white/5 text-gray-500 text-center text-sm font-medium">
                {totalModules - completedModules} modules remaining
              </div>
            ) : (
              <div className="mt-6 w-full py-3 px-4 rounded-xl bg-banano-green/20 border border-banano-green/30 text-banano-green text-center text-sm font-bold flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                Assessment Passed
              </div>
            )}
          </motion.div>
        </div>

        {/* Warning Banner for Failed Quiz */}
        <AnimatePresence>
          {quizEligibility?.isCertified === false && completedModules === 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card border-red-500/30 bg-red-500/10 p-6 mb-12 flex items-start gap-4"
            >
              <div className="p-3 bg-red-500/20 rounded-xl">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-400">Training Progress Reset</h3>
                <p className="text-red-300/80 mt-1 max-w-3xl">
                  Your previous quiz attempt did not meet the 80% passing threshold.
                  Please complete all training modules again before retaking the assessment.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Track-specific content */}
        {/* FULL track: Onboarding Checklist */}
        {userTrack?.name === 'FULL' && <OnboardingChecklist />}

        {/* CONDENSED track: Bio Update Card */}
        {userTrack?.name === 'CONDENSED' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nano-purple to-pink-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Update Your Bio</h3>
                  <p className="text-gray-400 text-sm">Keep your profile information current for your colleagues</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {bioStatus?.isComplete ? (
                  <span className="px-3 py-1.5 bg-banano-green/20 text-banano-green rounded-lg text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Completed
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-banano-yellow/20 text-banano-yellow rounded-lg text-sm font-medium">
                    Pending
                  </span>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowBioEditor(true)}
                  className="px-5 py-2.5 bg-nano-purple text-white rounded-xl font-bold hover:bg-nano-purple/80 transition-colors flex items-center gap-2"
                >
                  {bioStatus?.isComplete ? 'Edit Bio' : 'Add Bio'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bio Editor Modal */}
        <AnimatePresence>
          {showBioEditor && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={(e) => e.target === e.currentTarget && setShowBioEditor(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <BioEditor
                  onComplete={() => {
                    setShowBioEditor(false);
                    fetchData();
                  }}
                  onClose={() => setShowBioEditor(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Training Modules */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-white">Training Modules</h2>
            <p className="text-gray-400">Complete these core modules to unlock the final exam.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`glass-card group hover:bg-white/5 transition-all duration-300 relative overflow-hidden ${module.is_completed ? 'border-banano-green/30' : ''
                }`}
            >
              {/* Progress Bar Top */}
              <div className={`h-1.5 w-full absolute top-0 left-0 bg-gray-800`}>
                <motion.div
                  className={`h-full ${module.is_completed ? 'bg-banano-green' : 'bg-nano-blue'}`}
                  initial={{ width: 0 }}
                  animate={{ width: module.is_completed ? '100%' : '0%' }}
                />
              </div>

              <div className="p-7">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg transition-transform group-hover:scale-110 ${module.is_completed
                        ? 'bg-gradient-to-br from-banano-green to-green-600 text-white shadow-banano-green/30'
                        : 'bg-dark-800 border border-white/10 text-gray-400 group-hover:border-nano-blue/50 group-hover:text-nano-blue'
                      }`}>
                      {module.is_completed ? (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="font-mono">{(index + 1).toString().padStart(2, '0')}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-nano-blue transition-colors">
                        {module.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <span>{module.content_json?.sections?.length || 0} sections</span>
                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                        <span>~15 min</span>
                      </p>
                    </div>
                  </div>

                  {module.is_completed ? (
                    <span className="px-3 py-1 rounded-lg bg-banano-green/10 text-banano-green border border-banano-green/20 text-xs font-bold uppercase tracking-wider">
                      Completed
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/5 text-xs font-bold uppercase tracking-wider group-hover:bg-nano-blue/10 group-hover:text-nano-blue group-hover:border-nano-blue/20 transition-colors">
                      Pending
                    </span>
                  )}
                </div>

                <p className="text-gray-400 text-sm mb-6 leading-relaxed line-clamp-2">
                  {module.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {/* Auto-tags based on content */}
                  <span className="px-2.5 py-1 rounded-md bg-dark-800 border border-white/5 text-xs text-gray-400">
                    Security
                  </span>
                  {module.title.toLowerCase().includes('password') && (
                    <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400">
                      Authentication
                    </span>
                  )}
                  {module.title.toLowerCase().includes('phishing') && (
                    <span className="px-2.5 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400">
                      Social Eng
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={() => setSelectedModuleId(module.id)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${module.is_completed
                        ? 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                        : 'bg-nano-blue text-white shadow-lg shadow-nano-blue/25 hover:shadow-nano-blue/40 hover:-translate-y-0.5'
                      }`}
                  >
                    {module.is_completed ? 'Review Again' : 'Start Module'}
                    {!module.is_completed && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
