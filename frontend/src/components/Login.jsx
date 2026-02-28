import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // New state for success animation

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate credentials first (simulation or real attempt)
      // In a real app we might want to pre-validate, but here we'll just assume 
      // if it doesn't throw, it's good. But we need to call the REAL login to check credentials.
      // So we will try-catch the real login call.

      // However, calling 'login' updates the context immediately and unmounts Login.
      // We need to 'fake' it slightly or handle the promise but DELAY the state update of the App?
      // The AuthContext 'login' likely does `setUser(data)`.

      // FORCE the transition efffect:
      // We will perform the API call. If successful, we WAIT to update the global state
      // (This requires modifying AuthContext or just hacking it here by not waiting for the promise resolution to finish the UI?)
      // actually, we can't easily delay the context update if we call `login`.
      // 
      // Alternative: We interpret the user's request visually.
      // We will assume "Cinematic Transition" > "Instant Feedback".
      // 
      // Let's modify the UX:
      // 1. User clicks login.
      // 2. Await the actual API call (we hope it returns a promise).
      // 3. IF successful, we DO NOT return immediately. We set `isSuccess(true)`.
      // 4. We wait for animation (e.g. 1.5s).
      // 5. THEN we let the promise resolve/or trigger the context update.

      // Since I can't see useAuth implementation, I assume `login` is async.
      // I will wrap it.

      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password);
      }

      // If we got here, it was successful!
      // But wait, the component might have already unmounted if `login` updates state synchronously or quickly.
      // If `login` sets the user state, App.jsx re-renders and Login is gone.
      // So we won't see the animation.

      // Check App.jsx:
      // if (!isAuthenticated) return <Login />;
      // So yes, it disappears instantly.

      // To fix this without touching AuthContext significantly:
      // We can't. The moment `isAuthenticated` becomes true, Login dies.

      // Unless... we use a "Transition" component in App.jsx?
      // Or we just accept that we can't do the FULL transition unless we control the state update.

      // Wait, the user asked for UI advice and implementation.
      // "I want to see how this looks locally".

      // Let's try to add the animation simply. 
      // I will assume for now that I can't delay the unmount easily without changing AuthContext.
      // BUT, I can see `Dashboard.jsx`.

      // Let's add the visual flair to the LOCK itself in `Login.jsx` 
      // and maybe the user won't mind if it's a bit "cut" at the end, 
      // OR I can wrap the `login` call in a custom promise that sets a local state "isAnimating" 
      // preventing the *perceived* navigation? No, that relies on global state.

      // BEST PATH:
      // I'll make the lock icon FADE IN to the Dashboard's Nav Icon.
      // I will add `layoutId="security-lock"` to the lock in Login.
      // I will add `layoutId="security-lock"` to the logo in Dashboard.
      // I will wrap App's return in <AnimatePresence mode="wait"> (need access to App.jsx too).

      // Let's start with Login.jsx changes.

    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
      setLoading(false); // Only stop loading on error. On success, keep it 'loading' state until unmount.
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-nano-blue/20 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-nano-purple/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute top-[40%] right-[30%] w-[20%] h-[20%] bg-banano-yellow/10 rounded-full blur-[80px] animate-blob animation-delay-4000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo/Header */}
        <div className="text-center mb-10 relative mt-8">
          {/* The StrategyBrix Logo (Icon only) */}
          <motion.div
            layoutId="shared-lock-element"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center justify-center w-28 h-28 bg-gradient-dark rounded-2xl mb-6 shadow-[0_0_30px_rgba(32,156,233,0.3)] border border-white/10 relative z-20 overflow-hidden"
          >
            <img
              src="/logo-icon.png"
              alt="StrategyBrix Icon"
              className="w-full h-full object-contain invert grayscale brightness-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
            />

            {/* Success Glow Effect */}
            {loading && !error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.2 }}
                className="absolute inset-0 bg-nano-blue/30 rounded-2xl blur-xl -z-10"
              />
            )}
          </motion.div>

          <h1 className="text-4xl font-bold tracking-wide mb-2 text-white">
            <span className="text-[#209CE9] text-xs uppercase tracking-[0.4em] block mb-3 font-semibold">Welcome to</span>
            Strategy<span className="opacity-70">Brix.</span>
          </h1>
        </div>

        {/* Glass Card */}
        <div className="glass-card p-8">
          <div className="flex mb-8 p-1 bg-black/20 rounded-xl relative">
            {/* Sliding Tab Background */}
            <motion.div
              layout
              className="absolute h-[calc(100%-8px)] top-1 rounded-lg bg-gradient-primary shadow-lg"
              initial={false}
              animate={{
                left: isLogin ? '4px' : '50%',
                width: 'calc(50% - 4px)',
              }}
            />

            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-center font-bold text-sm z-10 transition-colors duration-200 ${isLogin ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-center font-bold text-sm z-10 transition-colors duration-200 ${!isLogin ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              Register
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm flex items-center gap-3"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
                  className="input-neon"
                  placeholder="John Smith"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-neon"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className="input-neon"
                placeholder="Minimum 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-neon-primary mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Demo Credentials</p>
            <div className="inline-flex gap-4 text-xs font-mono text-nano-blue bg-nano-blue/10 px-4 py-2 rounded-lg">
              <span>john.smith@company.com</span>
              <span className="text-white/20">|</span>
              <span>password123</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          © 2025 Security Awareness Training
        </p>
      </motion.div>
    </div>
  );
}
