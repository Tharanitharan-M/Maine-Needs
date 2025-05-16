'use client';

import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalUsers: number;
  pendingRequests: number;
  completedToday: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingRequests: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        if (response.ok) {
          setStats(data);
        } else {
          setError(data.error || 'Failed to fetch dashboard statistics');
        }
      } catch (error) {
        setError('Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-extrabold text-[#003366] mb-6">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/40 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-extrabold text-[#003366] mb-6">Dashboard Overview</h2>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/40 transition-transform hover:scale-[1.03] focus-within:scale-[1.03]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#003366] mb-2">Total Users</h3>
              <p className="text-4xl font-extrabold text-[#0066CC]">{stats.totalUsers}</p>
              <p className="text-base text-gray-500 mt-2">Active caseworkers</p>
            </div>
            <UserGroupIcon className="h-14 w-14 text-[#0066CC] opacity-30" aria-label="Total Users" />
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/40 transition-transform hover:scale-[1.03] focus-within:scale-[1.03]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#003366] mb-2">Pending Requests</h3>
              <p className="text-4xl font-extrabold text-[#0066CC]">{stats.pendingRequests}</p>
              <p className="text-base text-gray-500 mt-2">Needs attention</p>
            </div>
            <ClockIcon className="h-14 w-14 text-[#f59e42] opacity-30" aria-label="Pending Requests" />
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/40 transition-transform hover:scale-[1.03] focus-within:scale-[1.03]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#003366] mb-2">Completed Today</h3>
              <p className="text-4xl font-extrabold text-[#0066CC]">{stats.completedToday}</p>
              <p className="text-base text-gray-500 mt-2">Requests fulfilled</p>
            </div>
            <CheckCircleIcon className="h-14 w-14 text-[#22c55e] opacity-30" aria-label="Completed Today" />
          </div>
        </div>
      </div>
      {/* Recent Activity Section */}
      <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/40 mt-8">
        <h3 className="text-xl font-bold text-[#003366] mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <p className="text-gray-600">Activity tracking will be implemented here.</p>
        </div>
      </div>
    </div>
  );
} 