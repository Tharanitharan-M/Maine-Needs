'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const router = useRouter();

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
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login successful!');
      setTimeout(() => {
        router.replace('/admin');
      }, 500); // Give toast a moment to show
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
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B3768] flex-col justify-center px-12 py-12 text-white">
        <div className="max-w-md mx-auto w-full flex flex-col items-start">
          <div className="mb-8 w-full flex justify-center">
            <Image src="/logo.png" alt="Maine Needs Logo" width={160} height={160} />
          </div>
          <h1 className="text-3xl font-extrabold mb-4">Admin Portal</h1>
          <p className="mb-4 text-lg font-medium">Secure access to administrative functions and system management.</p>
          <ul className="mb-6 space-y-3 mt-4">
            <li className="flex items-center"><span className="mr-2">🔒</span><span><span className="font-semibold">Admin Access:</span> Restricted to authorized administrators only.</span></li>
            <li className="flex items-center"><span className="mr-2">⚙️</span><span><span className="font-semibold">System Management:</span> Manage users, settings, and system configurations.</span></li>
            <li className="flex items-center"><span className="mr-2">📊</span><span><span className="font-semibold">Analytics:</span> Access comprehensive system analytics and reports.</span></li>
          </ul>
        </div>
      </div>
      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F5F7FA]">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="lg:hidden mb-8">
            <Image src="/logo.png" alt="Maine Needs Logo" width={150} height={150} className="mx-auto" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-[#003366]">
            Admin Sign In
          </h2>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <form className="space-y-6" onSubmit={handleEmailLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#003366]">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0066CC] focus:border-[#0066CC] text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#003366]">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0066CC] focus:border-[#0066CC] text-gray-900"
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
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" onClick={handleForgotPassword} className="font-medium text-[#0066CC] hover:text-[#0052A3]">
                    Forgot your password?
                  </a>
                </div>
              </div>
              {resetMessage && (
                <div className="mt-2 text-green-600 text-sm text-center">{resetMessage}</div>
              )}
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0066CC] hover:bg-[#0052A3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0066CC]"
                >
                  Sign in
                </button>
              </div>
            </form>
            <div className="mt-6 text-center text-xs text-gray-500">
              Need admin access? Contact <a href="mailto:admin@maineneeds.org" className="underline">admin@maineneeds.org</a>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 