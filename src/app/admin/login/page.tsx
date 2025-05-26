'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Check if user is an admin (you'll need to implement this logic)
        const isAdmin = true; // Temporary for testing
        if (isAdmin) {
          router.replace('/admin');
        } else {
          // If not an admin, sign them out
          auth.signOut();
          setError('Access denied. Admin privileges required.');
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
        return 'No admin account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later or reset your password.';
      case 'auth/user-disabled':
        return 'This admin account has been disabled. Please contact support.';
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
        router.replace('/admin');
      }, 500);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const errorCode = (error as any).code || 'unknown';
        const errorMessage = getErrorMessage(errorCode);
        setError(errorMessage);
        toast.error(errorMessage);
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
        const errorMessage = getErrorMessage(errorCode);
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        setError('An unexpected error occurred');
        toast.error('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="relative min-h-screen h-screen w-screen flex overflow-hidden bg-gradient-to-br from-[#e0e7ff] via-[#f5f7fa] to-[#c7d2fe]">
      {/* Animated floating shapes background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        className="absolute inset-0 pointer-events-none z-0 w-full h-full"
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
              <h1 className="text-5xl font-extrabold mb-4 text-white text-center leading-tight drop-shadow-lg">Admin Portal</h1>
              <p className="mb-8 text-xl font-medium text-blue-100 text-center leading-relaxed max-w-lg">Secure access to administrative functions and system management for trusted partners.</p>
              <ul className="mb-8 space-y-6 w-full">
                <li className="flex items-start gap-4">
                  <svg aria-label="Admin Access" className="w-7 h-7 text-yellow-200 flex-shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="16" height="10" x="4" y="10" rx="2" fill="#facc15" stroke="none"/><path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="15" r="2" fill="#fff"/></svg>
                  <span><span className="font-bold text-white">Admin Access:</span> <span className="text-blue-100">Restricted to authorized administrators only.</span></span>
                </li>
                <li className="flex items-start gap-4">
                  <svg aria-label="System Management" className="w-7 h-7 text-blue-200 flex-shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#bfdbfe" strokeWidth="1.5" fill="none"/><path d="M12 8v4l3 3" stroke="#bfdbfe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span><span className="font-bold text-white">System Management:</span> <span className="text-blue-100">Manage users, settings, and system configurations.</span></span>
                </li>
                <li className="flex items-start gap-4">
                  <svg aria-label="Analytics" className="w-7 h-7 text-pink-200 flex-shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="14" width="4" height="6" fill="#f9a8d4"/><rect x="10" y="10" width="4" height="10" fill="#f9a8d4"/><rect x="16" y="6" width="4" height="14" fill="#f9a8d4"/></svg>
                  <span><span className="font-bold text-white">Analytics:</span> <span className="text-blue-100">Access comprehensive system analytics and reports.</span></span>
                </li>
              </ul>
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
          <h2 className="text-center text-3xl font-extrabold text-[#003366] mb-2">Admin Sign In</h2>
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
              Need admin access? Contact <a href="mailto:admin@maineneeds.org" className="underline">admin@maineneeds.org</a>.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 