'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const { creationTime, lastSignInTime } = user.metadata;
        if (creationTime === lastSignInTime) {
          router.replace('/caseworker/password-reset');
        } else {
          // Redirect to form page for caseworkers
          router.replace('/form');
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later or reset your password.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      default:
        return 'An error occurred during login. Please try again.';
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login successful!');
      setTimeout(() => {
        router.replace('/form');
      }, 500);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const errorCode = (error as any).code || 'unknown';
        setError(getErrorMessage(errorCode));
        toast.error(getErrorMessage(errorCode));
      } else {
        setError('An unexpected error occurred');
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    if (!email) {
      setError('Please enter your email address above first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage('Password reset email sent! Please check your inbox.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        const errorCode = (error as any).code || 'unknown';
        setError(getErrorMessage(errorCode));
        toast.error(getErrorMessage(errorCode));
      } else {
        setError('An unexpected error occurred');
        toast.error('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="relative min-h-screen flex overflow-hidden bg-gradient-to-br from-[#e0e7ff] via-[#f5f7fa] to-[#c7d2fe]">
      {/* Animated floating shapes background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        className="absolute inset-0 pointer-events-none z-0"
      >
        <motion.div
          className="absolute top-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-[#0B3768] blur-3xl opacity-60"
          animate={{ y: [0, 40, 0], x: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-100px] right-[-100px] w-[350px] h-[350px] rounded-full bg-[#0066CC] blur-3xl opacity-40"
          animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
        />
      </motion.div>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-transparent flex-col justify-center px-0 py-0 text-white z-10">
        <div className="flex items-center justify-center w-full h-full min-h-screen">
          <div className="relative w-full h-full flex flex-col items-center justify-center px-10 py-16 bg-gradient-to-br from-[#18345b]/95 via-[#0B3768]/90 to-[#18345b]/95 shadow-2xl border-r-2 border-white/10 rounded-none lg:rounded-r-2xl">
            <div className="absolute inset-0 rounded-none lg:rounded-r-2xl pointer-events-none" style={{boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'}}></div>
            <div className="relative z-10 flex flex-col items-center w-full max-w-xl">
              <div className="mb-8 w-full flex justify-center">
                <Image src='/logo.png' alt='Maine Needs Logo' width={140} height={140} />
              </div>
              <h1 className="text-5xl font-extrabold mb-4 text-white text-center leading-tight drop-shadow-lg">Welcome Back!</h1>
              <p className="mb-8 text-xl font-medium text-blue-100 text-center leading-relaxed max-w-lg">Supplying essentials so Mainers can thrive.<br/>Thank you for being part of our community effort.</p>
              <ul className="mb-8 space-y-6 w-full">
                <li className="flex items-start gap-4">
                  <svg aria-label="Secure Access" className="w-7 h-7 text-yellow-200 flex-shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="16" height="10" x="4" y="10" rx="2" fill="#facc15" stroke="none"/><path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="15" r="2" fill="#fff"/></svg>
                  <span><span className="font-bold text-white">Secure Access:</span> <span className="text-blue-100">Your data is protected with two-factor authentication and invite-only access.</span></span>
                </li>
                <li className="flex items-start gap-4">
                  <svg aria-label="Track Progress" className="w-7 h-7 text-green-200 flex-shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#bbf7d0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="12" cy="12" r="11" stroke="#bbf7d0" strokeWidth="1.5" fill="none"/></svg>
                  <span><span className="font-bold text-white">Track Progress:</span> <span className="text-blue-100">See every request move from submitted to packed to closed at a glance.</span></span>
                </li>
                <li className="flex items-start gap-4">
                  <svg aria-label="Save Time" className="w-7 h-7 text-orange-200 flex-shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2v6h6" stroke="#fdba74" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="#fdba74" strokeWidth="1.5" fill="none"/></svg>
                  <span><span className="font-bold text-white">Save Time:</span> <span className="text-blue-100">Auto-fill repeat items and generate PDFs—no copy-paste needed.</span></span>
                </li>
              </ul>
              <div className="text-sm text-blue-200 mb-8 text-center">Powered by <span className="font-bold text-white">300+ volunteers</span> and <span className="font-bold text-white">120 partner agencies</span> across Maine.</div>
              <div className="w-full flex flex-col items-center">
                <div className="mb-2 font-semibold text-white">Connect with us</div>
                <div className="flex space-x-4">
                  <a href="https://www.facebook.com/maineneeds" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-white/80"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                  <a href="https://www.instagram.com/maineneeds" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-white/80"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
                  <a href="https://www.linkedin.com/company/maineneeds" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-white/80"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Right Panel (Animated Card) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="lg:hidden mb-8">
            <Image src="/logo.png" alt="Maine Needs Logo" width={150} height={150} className="mx-auto" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-[#003366] mb-2">Sign in to your account</h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-lg py-10 px-6 shadow-2xl rounded-2xl sm:px-12 border border-white/40 relative">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 shadow"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {resetMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 text-green-600 text-sm text-center mb-2"
                >
                  {resetMessage}
                </motion.div>
              )}
            </AnimatePresence>
            <form className="space-y-6" onSubmit={handleEmailLogin} autoComplete="off">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#003366]">Email address</label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-gray-900 bg-white/90 transition-all duration-200"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#003366]">Password</label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-gray-900 bg-white/90 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#0066CC] focus:ring-[#0066CC] border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Remember me</label>
                </div>
                <div className="text-sm">
                  <a href="#" onClick={handleForgotPassword} className="font-medium text-[#0066CC] hover:text-[#0052A3] transition-colors">Forgot your password?</a>
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-gradient-to-r from-[#0066CC] to-[#0B3768] hover:from-[#0052A3] hover:to-[#003366] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0066CC] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <motion.span
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    />
                  ) : null}
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
            <div className="mt-6 text-center text-xs text-gray-500">
              Need access? Ask your Maine Needs contact or email <a href="mailto:support@maineneeds.org" className="underline">support@maineneeds.org</a>.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 