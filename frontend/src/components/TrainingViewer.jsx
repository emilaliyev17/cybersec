import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { motion } from 'framer-motion';

const PRESENTATIONS = [
  {
    id: 'ai-best-practices',
    title: 'AI Best Practices & Responsible Usage',
    description: 'Learn about responsible AI usage, data protection policies, and best practices for using AI tools at StrategyBRIX.',
    embedUrl: 'https://docs.google.com/presentation/d/1LGSxoI5eo4oBsSnMITJ7j3htuZh0HRXGzC5tradgyzg/embed?start=false&loop=false&delayms=3000',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    id: 'phishing-awareness',
    title: 'Phishing Awareness Training',
    description: 'Understand phishing threats, recognize red flags, and learn how to protect yourself and the organization from social engineering attacks.',
    embedUrl: 'https://docs.google.com/presentation/d/1l5TjmU7spomcsFrqTK9sT8tKlVbJPtUbEIRC9tli0IQ/embed?start=false&loop=false&delayms=3000',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
];

/**
 * TrainingViewer Component
 * Displays two Google Slides presentations with progress tracking.
 * User must view both presentations before taking the quiz.
 */
export default function TrainingViewer({ moduleId, onComplete, onBack }) {
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activePresentation, setActivePresentation] = useState(null);

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
    }
  }, [moduleId]);

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

  // Determine which presentation to show based on module
  const getPresentation = () => {
    if (!module) return null;
    const title = module.title?.toLowerCase() || '';
    if (title.includes('phishing')) return PRESENTATIONS[1];
    return PRESENTATIONS[0];
  };

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

  const presentation = getPresentation();

  // If a presentation is being viewed full-screen
  if (activePresentation) {
    return (
      <div className="relative max-w-7xl mx-auto py-8 px-4">
        {/* Background Ambience */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-nano-blue/10 rounded-full blur-[100px] animate-blob" />
          <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] bg-nano-purple/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mb-6 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-nano-blue/20 to-nano-purple/20 px-8 py-4 border-b border-white/5 flex items-center justify-between">
            <button
              onClick={() => setActivePresentation(null)}
              className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Module
            </button>
            <h2 className="text-lg font-bold text-white">{activePresentation.title}</h2>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card overflow-hidden"
        >
          <iframe
            src={activePresentation.embedUrl}
            className="w-full border-0"
            style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
            allowFullScreen
            title={activePresentation.title}
          />
        </motion.div>
      </div>
    );
  }

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
      </motion.div>

      {/* Presentation Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card overflow-hidden mb-8"
      >
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-nano-blue to-cyan-500 flex items-center justify-center shadow-lg shadow-nano-blue/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={presentation.icon} />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{presentation.title}</h3>
              <p className="text-sm text-gray-400">{presentation.description}</p>
            </div>
          </div>
        </div>

        {/* Embedded Presentation */}
        <div className="relative bg-black/20">
          <iframe
            src={presentation.embedUrl}
            className="w-full border-0"
            style={{ height: '500px' }}
            allowFullScreen
            title={presentation.title}
          />
        </div>

        <div className="p-4 bg-white/5 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Review the full presentation above, then mark as complete
          </p>
          <button
            onClick={() => setActivePresentation(presentation)}
            className="btn-neon-secondary text-sm px-4 py-2 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Expand
          </button>
        </div>
      </motion.div>

      {/* Complete Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center"
      >
        {module.is_completed ? (
          <div className="flex items-center gap-3 px-8 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-emerald-400 font-bold text-lg">Module Completed</span>
          </div>
        ) : (
          <button
            onClick={handleComplete}
            disabled={saving}
            className="px-10 py-4 rounded-xl font-bold text-lg bg-banano-green text-white hover:bg-green-500 hover:shadow-banano-green/40 hover:scale-105 shadow-lg transition-all flex items-center gap-3"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              <>
                Mark as Reviewed
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        )}
      </motion.div>
    </div>
  );
}
