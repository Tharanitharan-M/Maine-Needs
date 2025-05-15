'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminManagementPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { isAdmin } = useAuth();
  const router = useRouter();

  // Redirect if not admin
  if (!isAdmin) {
    router.push('/admin');
    return null;
  }

  const handleSetAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/set-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set admin privileges');
      }

      setMessage(data.message);
      setEmail('');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-[#003366] mb-6">Manage Admin Access</h1>
        
        <form onSubmit={handleSetAdmin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#003366]">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0066CC] focus:border-[#0066CC] bg-white text-gray-900 placeholder-gray-500"
              placeholder="Enter email address"
              required
            />
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#0066CC] text-white px-4 py-2 rounded hover:bg-[#0052A3] font-semibold"
          >
            Set as Admin
          </button>
        </form>
      </div>
    </div>
  );
} 