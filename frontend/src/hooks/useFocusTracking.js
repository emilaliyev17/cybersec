import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to track window focus for training compliance
 * Pauses timer when user tabs away and shows overlay
 */
export function useFocusTracking() {
  const [isFocused, setIsFocused] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [blurCount, setBlurCount] = useState(0);

  const intervalRef = useRef(null);
  const lastTickRef = useRef(Date.now());

  // Handle window blur (user tabs away)
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setIsPaused(true);
    setBlurCount((prev) => prev + 1);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle window focus (user returns)
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsPaused(false);
    lastTickRef.current = Date.now();
  }, []);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Also handle visibility change for more reliable detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBlur();
      } else {
        handleFocus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [handleBlur, handleFocus]);

  // Timer logic - only counts when focused
  useEffect(() => {
    if (isFocused && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isFocused, isPaused]);

  const resetTimer = useCallback(() => {
    setElapsedSeconds(0);
    setBlurCount(0);
    lastTickRef.current = Date.now();
  }, []);

  const manualPause = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const manualResume = useCallback(() => {
    if (isFocused) {
      setIsPaused(false);
      lastTickRef.current = Date.now();
    }
  }, [isFocused]);

  return {
    isFocused,
    isPaused,
    elapsedSeconds,
    blurCount,
    resetTimer,
    manualPause,
    manualResume,
    setElapsedSeconds,
  };
}
