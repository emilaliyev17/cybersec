import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { useFocusTracking } from '../hooks/useFocusTracking';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
// import { useWindowSize } from 'react-use'; // Removed: using custom hook to avoid dependency

// Helper for window size if react-use is not available
const useWindowSizeCustom = () => {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => setSize([window.innerWidth, window.innerHeight]);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return { width: size[0], height: size[1] };
};

export default function Quiz({ onComplete, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const { width, height } = useWindowSizeCustom();

  const { isFocused, elapsedSeconds } = useFocusTracking();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await axios.get(apiUrl('/api/quiz/questions'));
        setQuestions(response.data.questions);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleAnswer = (questionId, answerIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleSubmit = useCallback(async () => {
    const formattedAnswers = questions.map((q) => ({
      question_id: q.id,
      selected_answer_index: answers[q.id] ?? -1,
    }));

    try {
      setSubmitting(true);
      const response = await axios.post(apiUrl('/api/quiz/submit'), {
        answers: formattedAnswers,
        time_taken_seconds: elapsedSeconds,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  }, [questions, answers, elapsedSeconds]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  // Focus warning overlay
  if (!isFocused && !result) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card border-red-500/50 p-8 max-w-md mx-4 text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]"
        >
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Quiz Paused</h2>
          <p className="text-gray-300 mb-6 text-lg">
            Compliance Check: Please focus on the assessment window. Looking away is logged.
          </p>
          <button
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
          >
            Click anywhere to resume
          </button>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-blue"></div>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="glass-card border-red-500/30 p-6 text-center max-w-lg mx-auto mt-20">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={onBack} className="btn-neon-secondary">
          Go Back
        </button>
      </div>
    );
  }

  // Result Screen
  if (result) {
    const isPassed = result.passed;
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 relative">
        {isPassed && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`glass-card overflow-hidden ${isPassed ? 'border-banano-green/50 shadow-[0_0_50px_rgba(76,191,75,0.2)]' : 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)]'}`}
        >
          <div className={`p-10 text-center relative overflow-hidden`}>
            {/* Background glow for result */}
            <div className={`absolute inset-0 opacity-10 ${isPassed ? 'bg-banano-green' : 'bg-red-600'}`} />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 ${isPassed ? 'bg-banano-green text-black' : 'bg-red-500 text-white'
                }`}
            >
              {isPassed ? (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <motion.svg
                  animate={{ x: [-5, 5, -5, 5, 0] }}
                  transition={{ duration: 0.4 }}
                  className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </motion.svg>
              )}
            </motion.div>

            <h2 className="text-4xl font-bold mb-3 text-white">
              {isPassed ? 'Assessment Passed!' : 'Assessment Failed'}
            </h2>

            <p className="text-xl mb-8 text-gray-300">
              {result.message}
            </p>

            <div className="flex justify-center flex-wrap gap-6 mb-8">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 min-w-[140px]">
                <p className={`text-5xl font-bold mb-1 ${isPassed ? 'text-banano-green' : 'text-red-500'}`}>{result.score}%</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Your Score</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 min-w-[140px]">
                <p className="text-5xl font-bold text-white mb-1">{result.correctCount}<span className="text-2xl text-gray-500">/{result.totalQuestions}</span></p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Correct</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 min-w-[140px]">
                <p className="text-5xl font-bold text-white mb-1">80<span className="text-2xl text-gray-500">%</span></p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Required</p>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="p-8 border-t border-white/10 bg-black/20">
            <h3 className="font-bold text-white mb-6 text-xl">Question Review</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {result.detailedResults?.map((item, index) => (
                <div
                  key={index}
                  className={`p-5 rounded-xl border flex items-start gap-4 ${item.is_correct
                    ? 'bg-banano-green/5 border-banano-green/20'
                    : 'bg-red-500/5 border-red-500/20'
                    }`}
                >
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${item.is_correct ? 'bg-banano-green text-black' : 'bg-red-500 text-white'
                    }`}>
                    {item.is_correct ? '✓' : '✗'}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-white text-lg mb-2">{item.question_text}</p>
                    <p className="text-sm text-gray-400 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                      <span className="text-nano-blue font-bold">Explanation: </span>
                      {item.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="p-8 bg-white/5 border-t border-white/10">
            <button
              onClick={() => onComplete(result)}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all ${isPassed
                ? 'bg-gradient-to-r from-banano-green to-emerald-600 text-white shadow-banano-green/20'
                : 'bg-gradient-to-r from-nano-blue to-nano-purple text-white shadow-nano-blue/20'
                }`}
            >
              {isPassed ? 'Continue to Dashboard' : 'Retake Assessment'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-nano-blue/20 to-nano-purple/20 px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Exit Quiz
          </button>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-mono text-nano-blue">
              {formatTime(elapsedSeconds)}
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-white">
              {questions.length - answeredCount} remaining
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 h-1.5">
          <motion.div
            className="bg-gradient-accent h-full shadow-[0_0_10px_rgba(251,221,17,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          ></motion.div>
        </div>

        {/* Question Area */}
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              Question {currentIndex + 1} <span className="text-gray-700">/ {questions.length}</span>
            </span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${currentQuestion.difficulty === 'easy'
              ? 'bg-green-500/10 text-green-500 border-green-500/20'
              : currentQuestion.difficulty === 'hard'
                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
              }`}>
              {currentQuestion.difficulty}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-8 leading-snug">
            {currentQuestion.question_text}
          </h2>

          {/* Options */}
          <div className="space-y-4 mb-10">
            {currentQuestion.options_json.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleAnswer(currentQuestion.id, index)}
                className={`w-full p-5 rounded-xl border text-left transition-all duration-200 group relative overflow-hidden ${answers[currentQuestion.id] === index
                  ? 'border-nano-blue bg-nano-blue/20 text-white shadow-[0_0_20px_rgba(32,156,233,0.15)]'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30 hover:bg-white/10'
                  }`}
              >
                {/* Selection Highlight */}
                {answers[currentQuestion.id] === index && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-nano-blue" />
                )}

                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${answers[currentQuestion.id] === index
                    ? 'bg-nano-blue text-white'
                    : 'bg-gray-800 text-gray-500 group-hover:bg-gray-700 group-hover:text-white'
                    }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-lg">{option}</span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-white/10">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="btn-neon-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {/* Pagination Dots */}
            <div className="hidden sm:flex gap-1.5">
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                    ? 'bg-white w-6'
                    : answers[q.id] !== undefined
                      ? 'bg-banano-green'
                      : 'bg-gray-700 hover:bg-gray-500'
                    }`}
                />
              ))}
            </div>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="btn-neon-primary px-8"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all ${allAnswered
                  ? 'bg-gradient-to-r from-banano-green to-emerald-600 text-white hover:shadow-banano-green/30 hover:scale-105'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                  }`}
              >
                {submitting ? 'Submitting...' : 'Submit Assessment'}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Warning if not all answered */}
      <AnimatePresence>
        {!allAnswered && currentIndex === questions.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 p-4 rounded-xl bg-banano-yellow/10 border border-banano-yellow/20 text-banano-yellow flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">
              {questions.length - answeredCount} unanswered question(s) remaining.
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
