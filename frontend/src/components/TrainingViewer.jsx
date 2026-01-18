import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * TrainingViewer Component
 * Displays training module content. Module is complete when all sections are viewed.
 */
export default function TrainingViewer({ moduleId, onComplete, onBack }) {
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [viewedSections, setViewedSections] = useState(new Set([0]));
  const [saving, setSaving] = useState(false);

  // Fetch module data
  useEffect(() => {
    const fetchModule = async () => {
      try {
        setLoading(true);
        const response = await axios.get(apiUrl(`/api/modules/${moduleId}`));
        setModule(response.data.module);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load module');
      } finally {
        setLoading(false);
      }
    };

    if (moduleId) {
      fetchModule();
      setViewedSections(new Set([0]));
      setCurrentSectionIndex(0);
    }
  }, [moduleId]);

  const goToSection = (index) => {
    setCurrentSectionIndex(index);
    setViewedSections((prev) => new Set([...prev, index]));
  };

  const handleComplete = useCallback(async () => {
    if (!module) return;

    try {
      setSaving(true);
      await axios.post(apiUrl(`/api/modules/${moduleId}/progress`), {
        watched_seconds: 0,
        is_completed: true,
      });
      onComplete?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete module');
    } finally {
      setSaving(false);
    }
  }, [module, moduleId, onComplete]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card border-red-500/30 p-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={onBack} className="btn-neon-secondary">
          Go Back
        </button>
      </div>
    );
  }

  if (!module) return null;

  const content = module.content_json;
  const sections = content.sections || [];
  const currentSection = sections[currentSectionIndex];
  const totalSections = sections.length;
  const viewedCount = viewedSections.size;
  const allSectionsViewed = viewedCount >= totalSections;
  const progressPercentage = Math.round((viewedCount / totalSections) * 100);

  return (
    <div className="relative max-w-5xl mx-auto py-8 px-4">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-nano-blue/10 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] bg-nano-purple/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card mb-8 overflow-hidden z-10 relative"
      >
        <div className="bg-gradient-to-r from-nano-blue/20 to-nano-purple/20 px-8 py-6 border-b border-white/5">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors mb-4 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-white mb-2">{module.title}</h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-3xl">{module.description}</p>
        </div>

        {/* Timeline Progress */}
        <div className="px-8 py-6 bg-black/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-nano-blue uppercase tracking-wider">
              Module Progress
            </span>
            <span className="text-sm text-gray-400">
              {viewedCount} of {totalSections} steps complete
            </span>
          </div>

          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "circOut" }}
            />
          </div>

          {/* Section Dots */}
          <div className="flex justify-between mt-4 px-1">
            {sections.map((_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <motion.div
                  className={`w-3 h-3 rounded-full transition-colors duration-300 ${idx <= currentSectionIndex
                      ? 'bg-banano-yellow shadow-[0_0_10px_rgba(251,221,17,0.5)]'
                      : viewedSections.has(idx)
                        ? 'bg-banano-green/50'
                        : 'bg-gray-700'
                    }`}
                  animate={{
                    scale: idx === currentSectionIndex ? 1.5 : 1
                  }}
                />
                {idx === currentSectionIndex && (
                  <motion.div
                    layoutId="active-indicator"
                    className="w-12 h-1 bg-banano-yellow/50 rounded-full blur-sm absolute -bottom-2"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="glass-card p-4 sticky top-28">
            <h3 className="text-white font-bold mb-4 px-2">Table of Contents</h3>
            <div className="space-y-2">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => goToSection(index)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 relative overflow-hidden group ${index === currentSectionIndex
                      ? 'bg-nano-blue text-white shadow-lg shadow-nano-blue/20 font-medium'
                      : viewedSections.has(index)
                        ? 'text-gray-300 hover:bg-white/5'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${index === currentSectionIndex ? 'border-white text-white' :
                        viewedSections.has(index) ? 'border-banano-green text-banano-green' : 'border-gray-600'
                      }`}>
                      {viewedSections.has(index) ? '✓' : index + 1}
                    </span>
                    <span className="line-clamp-1">{section.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentSectionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="glass-card p-8 min-h-[500px] flex flex-col"
            >
              {currentSection && (
                <>
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <span className="text-nano-blue text-sm font-bold uppercase tracking-widest mb-2 block">
                      Section {currentSectionIndex + 1}
                    </span>
                    <h2 className="text-3xl font-bold text-white">
                      {currentSection.title}
                    </h2>
                  </div>

                  <div className="prose prose-invert prose-lg max-w-none flex-grow">
                    <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                      {currentSection.content}
                    </div>
                  </div>

                  {currentSection.is_interactive && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-8 bg-gradient-to-br from-banano-yellow/10 to-transparent border border-banano-yellow/20 rounded-2xl p-6 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <svg className="w-24 h-24 text-banano-yellow" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-banano-yellow text-lg mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Security Insight
                      </h3>
                      <p className="text-gray-300 relative z-10">
                        {currentSection.correct_action}
                      </p>
                    </motion.div>
                  )}

                  {/* Section Navigation Buttons */}
                  <div className="flex justify-between mt-12 pt-6 border-t border-white/10">
                    <button
                      onClick={() => goToSection(Math.max(0, currentSectionIndex - 1))}
                      disabled={currentSectionIndex === 0}
                      className="btn-neon-secondary disabled:opacity-30 disabled:cursor-not-allowed px-6"
                    >
                      Previous
                    </button>

                    {currentSectionIndex < sections.length - 1 ? (
                      <button
                        onClick={() => goToSection(currentSectionIndex + 1)}
                        className="btn-neon-primary px-8"
                      >
                        Next Section
                        <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={handleComplete}
                        disabled={!allSectionsViewed || saving}
                        className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${allSectionsViewed
                            ? 'bg-banano-green text-white hover:bg-green-500 hover:shadow-banano-green/40 hover:scale-105'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        {saving ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Saving...
                          </span>
                        ) : allSectionsViewed ? (
                          <>
                            Complete Module
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </>
                        ) : (
                          `Read all sections first`
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Key Takeaways */}
          {content.key_takeaways && content.key_takeaways.length > 0 && (
            <div className="glass-card mt-6 p-6 border-l-4 border-nano-blue">
              <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-nano-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Key Takeaways
              </h3>
              <ul className="space-y-3">
                {content.key_takeaways.map((takeaway, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-nano-blue flex-shrink-0" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
