import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

/**
 * VideoTraining Component
 * Displays video training module. User must watch all videos to complete.
 */
export default function VideoTraining({ moduleId, onComplete, onBack }) {
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [watchedVideos, setWatchedVideos] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchModule = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/modules/${moduleId}`);
        setModule(response.data.module);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load module');
      } finally {
        setLoading(false);
      }
    };

    if (moduleId) {
      fetchModule();
      setWatchedVideos(new Set());
      setCurrentVideoIndex(0);
    }
  }, [moduleId]);

  const handleVideoEnded = () => {
    setWatchedVideos((prev) => new Set([...prev, currentVideoIndex]));
  };

  const goToVideo = (index) => {
    setCurrentVideoIndex(index);
  };

  const handleComplete = async () => {
    if (!module) return;

    try {
      setSaving(true);
      await axios.post(`/api/modules/${moduleId}/progress`, {
        watched_seconds: 0,
        is_completed: true,
      });
      onComplete?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete module');
    } finally {
      setSaving(false);
    }
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

  const content = module.content_json;
  const videos = content.videos || [];
  const currentVideo = videos[currentVideoIndex];
  const totalVideos = videos.length;
  const watchedCount = watchedVideos.size;
  const allVideosWatched = watchedCount >= totalVideos;
  const progressPercentage = Math.round((watchedCount / totalVideos) * 100);

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
        className="glass-card mb-8 overflow-hidden"
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
              Video Progress
            </span>
            <span className="text-sm text-gray-400">
              {watchedCount} of {totalVideos} videos watched
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
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Video List Sidebar */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="glass-card p-4 sticky top-28">
            <h3 className="text-white font-bold mb-4 px-2">Video List</h3>
            <div className="space-y-2">
              {videos.map((video, index) => (
                <button
                  key={index}
                  onClick={() => goToVideo(index)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${index === currentVideoIndex
                      ? 'bg-nano-blue text-white shadow-lg shadow-nano-blue/20 font-medium'
                      : watchedVideos.has(index)
                        ? 'text-gray-300 hover:bg-white/5'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${index === currentVideoIndex ? 'border-white text-white' :
                        watchedVideos.has(index) ? 'border-banano-green text-banano-green' : 'border-gray-600'
                      }`}>
                      {watchedVideos.has(index) ? '✓' : index + 1}
                    </span>
                    <span className="line-clamp-1">{video.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <motion.div
            key={currentVideoIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card overflow-hidden"
          >
            {currentVideo && (
              <>
                {/* Video Player */}
                <div className="relative bg-black aspect-video">
                  <video
                    ref={videoRef}
                    key={currentVideo.url}
                    className="w-full h-full"
                    controls
                    onEnded={handleVideoEnded}
                    playsInline
                  >
                    <source src={currentVideo.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Video Info */}
                <div className="p-6">
                  <div className="mb-4 pb-4 border-b border-white/10">
                    <span className="text-nano-blue text-sm font-bold uppercase tracking-widest mb-2 block">
                      Video {currentVideoIndex + 1}
                    </span>
                    <h2 className="text-2xl font-bold text-white">
                      {currentVideo.title}
                    </h2>
                  </div>

                  {currentVideo.description && (
                    <p className="text-gray-300 leading-relaxed mb-6">
                      {currentVideo.description}
                    </p>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4 border-t border-white/10">
                    <button
                      onClick={() => goToVideo(Math.max(0, currentVideoIndex - 1))}
                      disabled={currentVideoIndex === 0}
                      className="btn-neon-secondary disabled:opacity-30 disabled:cursor-not-allowed px-6"
                    >
                      Previous
                    </button>

                    {currentVideoIndex < videos.length - 1 ? (
                      <button
                        onClick={() => goToVideo(currentVideoIndex + 1)}
                        className="btn-neon-primary px-8"
                      >
                        Next Video
                        <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={handleComplete}
                        disabled={!allVideosWatched || saving}
                        className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${allVideosWatched
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
                        ) : allVideosWatched ? (
                          <>
                            Complete Module
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </>
                        ) : (
                          `Watch all videos first`
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
