import { useId } from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedHourglass Component
 * SVG hourglass with sand flowing from top to bottom chamber.
 *
 * @param {number} progress - 0 to 1, how far through the timer
 * @param {number} size - width in pixels (height is 1.5x)
 * @param {boolean} isComplete - whether the timer has finished
 */
export default function AnimatedHourglass({ progress = 0, size = 48, isComplete = false }) {
  const id = useId();
  const topClipId = `top-chamber-${id}`;
  const bottomClipId = `bottom-chamber-${id}`;

  const p = Math.min(1, Math.max(0, progress));

  // Chamber dimensions within viewBox (0 0 64 96)
  // Top chamber: from y=10 to y=44 (height 34)
  // Bottom chamber: from y=52 to y=86 (height 34)
  const chamberHeight = 34;

  const topSandHeight = (1 - p) * chamberHeight;
  const bottomSandHeight = p * chamberHeight;

  // Sand color
  const sandColor = '#FBDD11';
  const sandColorDark = '#F59E0B';
  const frameColor = isComplete ? '#4CBF4B' : '#209CE9';
  const frameColorDim = isComplete ? 'rgba(76,191,75,0.2)' : 'rgba(32,156,233,0.2)';

  return (
    <motion.div
      className="inline-flex items-center justify-center flex-shrink-0"
      animate={isComplete ? {
        filter: [
          'drop-shadow(0 0 0px #4CBF4B)',
          'drop-shadow(0 0 12px #4CBF4B)',
          'drop-shadow(0 0 0px #4CBF4B)',
        ],
      } : {
        filter: 'drop-shadow(0 0 0px transparent)',
      }}
      transition={isComplete ? { duration: 1.5, repeat: 2 } : {}}
    >
      <svg
        width={size}
        height={size * 1.5}
        viewBox="0 0 64 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Sand gradient */}
          <linearGradient id={`sand-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sandColor} />
            <stop offset="100%" stopColor={sandColorDark} />
          </linearGradient>

          {/* Top chamber clip path - trapezoid narrowing to center */}
          <clipPath id={topClipId}>
            <path d="M10 10 L54 10 L36 44 L28 44 Z" />
          </clipPath>

          {/* Bottom chamber clip path - trapezoid widening from center */}
          <clipPath id={bottomClipId}>
            <path d="M28 52 L36 52 L54 86 L10 86 Z" />
          </clipPath>
        </defs>

        {/* Glass body outline */}
        {/* Top chamber */}
        <path
          d="M10 10 L54 10 L36 44 L28 44 Z"
          fill="rgba(255,255,255,0.03)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        {/* Bottom chamber */}
        <path
          d="M28 52 L36 52 L54 86 L10 86 Z"
          fill="rgba(255,255,255,0.03)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        {/* Neck */}
        <path
          d="M28 44 L36 44 L36 52 L28 52 Z"
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />

        {/* Top sand (shrinking from bottom up) */}
        {topSandHeight > 0.5 && (
          <motion.rect
            x="0"
            y={10}
            width="64"
            height={topSandHeight}
            fill={`url(#sand-grad-${id})`}
            clipPath={`url(#${topClipId})`}
            initial={false}
            animate={{ height: topSandHeight }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        )}

        {/* Bottom sand (growing from bottom up) */}
        {bottomSandHeight > 0.5 && (
          <motion.rect
            x="0"
            y={86 - bottomSandHeight}
            width="64"
            height={bottomSandHeight}
            fill={`url(#sand-grad-${id})`}
            clipPath={`url(#${bottomClipId})`}
            initial={false}
            animate={{
              y: 86 - bottomSandHeight,
              height: bottomSandHeight,
            }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        )}

        {/* Falling sand stream through the neck */}
        {!isComplete && p < 1 && p > 0 && (
          <motion.rect
            x="30"
            y="43"
            width="4"
            height="10"
            rx="2"
            fill={sandColor}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Sand particles near the neck */}
        {!isComplete && p < 1 && p > 0 && (
          <>
            <motion.circle
              cx="31"
              cy="48"
              r="1.2"
              fill={sandColor}
              animate={{ y: [0, 6, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
            />
            <motion.circle
              cx="33"
              cy="46"
              r="1"
              fill={sandColorDark}
              animate={{ y: [0, 8, 0], opacity: [0.7, 0.2, 0.7] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}

        {/* Top frame bar */}
        <rect
          x="4"
          y="4"
          width="56"
          height="6"
          rx="3"
          fill={frameColorDim}
          stroke={frameColor}
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />

        {/* Bottom frame bar */}
        <rect
          x="4"
          y="86"
          width="56"
          height="6"
          rx="3"
          fill={frameColorDim}
          stroke={frameColor}
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />
      </svg>
    </motion.div>
  );
}
