import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDE_DURATION = 30; // seconds per slide
const FIRST_SLIDE_DURATION = 3; // seconds for the first (title) slide

// Returns the required duration for a given slide index
const getSlideDuration = (slideIndex) =>
  slideIndex === 0 ? FIRST_SLIDE_DURATION : SLIDE_DURATION;

const PRESENTATIONS = [
  {
    id: 'ai-best-practices',
    title: 'AI Best Practices & Responsible Usage',
    description: 'Learn about responsible AI usage, data protection policies, and best practices for using AI tools at StrategyBRIX.',
    slidesPath: '/slides/ai-best-practices',
    slideCount: 10,
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    id: 'phishing-awareness',
    title: 'Phishing Awareness Training',
    description: 'Understand phishing threats, recognize red flags, and learn how to protect yourself and the organization from social engineering attacks.',
    slidesPath: '/slides/phishing-awareness',
    slideCount: 21,
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
];

/**
 * TrainingViewer Component
 * Displays presentation slides one by one with a 30-second timer per slide.
 * User must view every slide for 30 seconds before marking the module as reviewed.
 */
export default function TrainingViewer({ moduleId, onComplete, onBack }) {
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Slide viewer state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewedSlides, setViewedSlides] = useState(new Set());
  const [slideTimer, setSlideTimer] = useState(0);

  // Focus tracking for pausing timer
  const [isFocused, setIsFocused] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef(null);
  const slideProgressRef = useRef({}); // {slideIndex: elapsedSeconds}
  const prevSlideRef = useRef(0);
  const fullscreenRef = useRef(null);

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
    }
  }, [moduleId]);

  // Focus/blur tracking — pause timer when user tabs away
  useEffect(() => {
    const handleBlur = () => setIsFocused(false);
    const handleFocus = () => setIsFocused(true);
    const handleVisibility = () => {
      setIsFocused(!document.hidden);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Save/restore timer when slide changes
  useEffect(() => {
    // Save progress of the slide we're leaving
    slideProgressRef.current[prevSlideRef.current] = slideTimer;

    if (viewedSlides.has(currentSlide)) {
      setSlideTimer(getSlideDuration(currentSlide));
    } else {
      // Restore saved progress (or 0 if never visited)
      setSlideTimer(slideProgressRef.current[currentSlide] || 0);
    }

    prevSlideRef.current = currentSlide;
  }, [currentSlide]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer tick — only when focused and slide not yet viewed
  // Marks slide as viewed ONLY when the timer naturally reaches SLIDE_DURATION
  useEffect(() => {
    if (viewedSlides.has(currentSlide)) return;
    if (!isFocused) return;

    timerRef.current = setInterval(() => {
      setSlideTimer((prev) => {
        const next = prev + 1;
        slideProgressRef.current[currentSlide] = next;
        const duration = getSlideDuration(currentSlide);
        if (next >= duration) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setViewedSlides((prevViewed) => new Set([...prevViewed, currentSlide]));
          return duration;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentSlide, isFocused, viewedSlides]); // eslint-disable-line react-hooks/exhaustive-deps

  // Preload next 2 slides
  useEffect(() => {
    const presentation = getPresentation();
    if (!presentation) return;

    for (let i = 1; i <= 2; i++) {
      const nextIdx = currentSlide + i;
      if (nextIdx < presentation.slideCount) {
        const img = new Image();
        img.src = getSlideUrl(presentation, nextIdx);
      }
    }
  }, [currentSlide, module]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fullscreen support
  const toggleFullscreen = useCallback(() => {
    if (!fullscreenRef.current) return;
    if (!document.fullscreenElement) {
      fullscreenRef.current.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

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

  // Determine which presentation to show based on module title
  const getPresentation = () => {
    if (!module) return null;
    const title = module.title?.toLowerCase() || '';
    if (title.includes('phishing')) return PRESENTATIONS[1];
    return PRESENTATIONS[0];
  };

  const getSlideUrl = (pres, index) => {
    const num = String(index + 1).padStart(2, '0');
    return `${pres.slidesPath}/slide-${num}.png`;
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
  if (!presentation) return null;

  const totalSlides = presentation.slideCount;
  const currentSlideViewed = viewedSlides.has(currentSlide);
  const allSlidesViewed = viewedSlides.size >= totalSlides;
  const currentDuration = getSlideDuration(currentSlide);
  const timerProgress = Math.min(slideTimer / currentDuration, 1);
  const remaining = currentDuration - slideTimer;

  const canGoNext = currentSlideViewed && currentSlide < totalSlides - 1;
  const canGoPrev = currentSlide > 0;

  // A slide is accessible if all previous slides have been viewed
  const isSlideAccessible = (i) => i === 0 || Array.from({ length: i }, (_, idx) => idx).every((idx) => viewedSlides.has(idx));

  // If module already completed, show free-browse mode
  if (module.is_completed) {
    return (
      <div className="relative mx-auto py-8 px-3">
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-nano-blue/10 rounded-full blur-[100px] animate-blob" />
          <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] bg-nano-purple/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mb-6 overflow-hidden"
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
            <div className="flex items-center gap-3 mt-4">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400 font-bold text-lg">Module Completed</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentSlide}
              src={getSlideUrl(presentation, currentSlide)}
              alt={`Slide ${currentSlide + 1}`}
              className="w-full h-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>
          <div className="p-4 bg-white/5 flex items-center justify-between">
            <button
              onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
              disabled={currentSlide === 0}
              className="btn-neon-secondary disabled:opacity-30 disabled:cursor-not-allowed px-6 min-w-[150px] text-center"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Slide {currentSlide + 1} of {totalSlides}
            </span>
            <button
              onClick={() => setCurrentSlide((p) => Math.min(totalSlides - 1, p + 1))}
              disabled={currentSlide >= totalSlides - 1}
              className="btn-neon-primary disabled:opacity-30 disabled:cursor-not-allowed px-6 min-w-[150px] text-center"
            >
              Next
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto py-8 px-3">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-nano-blue/10 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] bg-nano-purple/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card mb-6 overflow-hidden z-10 relative"
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

        {/* Progress Bar */}
        <div className="px-8 py-6 bg-black/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-nano-blue uppercase tracking-wider">
              Slide Progress
            </span>
            <span className="text-sm text-gray-400">
              {viewedSlides.size} of {totalSlides} slides reviewed
            </span>
          </div>
          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-accent"
              initial={{ width: 0 }}
              animate={{ width: `${(viewedSlides.size / totalSlides) * 100}%` }}
              transition={{ duration: 0.5, ease: 'circOut' }}
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Slide List Sidebar */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="glass-card p-4 sticky top-28">
            <h3 className="text-white font-bold mb-4 px-2">Slides</h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              {Array.from({ length: totalSlides }, (_, i) => {
                const accessible = isSlideAccessible(i);
                return (
                  <button
                    key={i}
                    onClick={() => accessible && setCurrentSlide(i)}
                    disabled={!accessible}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${!accessible
                      ? 'text-gray-600 cursor-not-allowed opacity-40'
                      : i === currentSlide
                        ? 'bg-nano-blue text-white shadow-lg shadow-nano-blue/20 font-medium'
                        : viewedSlides.has(i)
                          ? 'text-gray-300 hover:bg-white/5'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${!accessible
                          ? 'border-gray-700 text-gray-600'
                          : i === currentSlide
                            ? 'border-white text-white'
                            : viewedSlides.has(i)
                              ? 'border-banano-green text-banano-green'
                              : 'border-gray-600'
                          }`}
                      >
                        {!accessible ? '🔒' : viewedSlides.has(i) ? '✓' : i + 1}
                      </span>
                      <span className="line-clamp-1">Slide {i + 1}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Slide Area */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <motion.div
            ref={fullscreenRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card overflow-hidden ${isFullscreen ? 'flex flex-col h-screen bg-dark-900' : ''}`}
          >
            {/* Slide Image */}
            <div className={`relative bg-black/20 ${isFullscreen ? 'flex-1 flex items-center justify-center overflow-hidden' : ''}`}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentSlide}
                  src={getSlideUrl(presentation, currentSlide)}
                  alt={`Slide ${currentSlide + 1}`}
                  className={isFullscreen ? 'max-w-full max-h-full object-contain' : 'w-full h-auto block'}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                  draggable={false}
                />
              </AnimatePresence>

              {/* Focus lost overlay */}
              {!isFocused && !currentSlideViewed && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-white font-bold text-lg">Timer Paused</p>
                    <p className="text-gray-400 text-sm mt-1">Return to this window to continue</p>
                  </div>
                </div>
              )}
            </div>

            {/* Timer + Navigation */}
            <div className="p-6 border-t border-white/10">
              {/* Timer bar */}
              <div className="mb-6">
                {currentSlideViewed ? (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <svg className="w-5 h-5 text-banano-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-banano-green font-bold">Slide reviewed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative h-3 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute top-0 left-0 h-full rounded-full"
                        style={{
                          background: timerProgress < 1
                            ? 'linear-gradient(90deg, #209CE9, #7C3AED)'
                            : '#4CBF4B',
                        }}
                        initial={false}
                        animate={{ width: `${(1 - timerProgress) * 100}%` }}
                        transition={{ duration: 0.3, ease: 'linear' }}
                      />
                    </div>
                    <span className="text-lg font-bold text-white font-mono min-w-[48px] text-right">
                      {remaining}s
                    </span>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
                  disabled={!canGoPrev}
                  className="btn-neon-secondary disabled:opacity-30 disabled:cursor-not-allowed px-6 min-w-[150px] text-center"
                >
                  Previous
                </button>

                <div className="flex items-center gap-3 hidden sm:flex">
                  <span className="text-sm text-gray-400">
                    Slide {currentSlide + 1} of {totalSlides}
                    {!currentSlideViewed && ` • ${remaining}s`}
                  </span>
                  <button
                    onClick={toggleFullscreen}
                    className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9v-4m0 4h-4m4 0l-5-5M15 9v-4m0 4h4m-4 0l5-5M9 15v4m0-4h-4m4 0l-5 5M15 15v4m0-4h4m-4 0l5 5" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                      </svg>
                    )}
                  </button>
                </div>

                {currentSlide < totalSlides - 1 ? (
                  <motion.button
                    onClick={() => canGoNext && setCurrentSlide((p) => p + 1)}
                    disabled={!canGoNext}
                    whileHover={canGoNext ? { scale: 1.03 } : {}}
                    whileTap={canGoNext ? { scale: 0.97 } : {}}
                    className={`px-6 py-3 rounded-xl font-bold transition-all min-w-[150px] text-center justify-center ${canGoNext
                      ? 'bg-gradient-to-r from-nano-blue to-nano-purple text-white shadow-lg shadow-nano-blue/20 hover:shadow-nano-blue/40'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                      }`}
                  >
                    Next Slide
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleComplete}
                    disabled={!allSlidesViewed || saving}
                    whileHover={allSlidesViewed ? { scale: 1.03 } : {}}
                    whileTap={allSlidesViewed ? { scale: 0.97 } : {}}
                    className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg min-w-[150px] text-center justify-center flex items-center gap-2 ${allSlidesViewed
                      ? 'bg-banano-green text-white hover:bg-green-500 hover:shadow-banano-green/40'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                      }`}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </span>
                    ) : allSlidesViewed ? (
                      <>
                        Mark as Reviewed
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    ) : (
                      `View all slides first (${viewedSlides.size}/${totalSlides})`
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
