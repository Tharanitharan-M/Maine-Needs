'use client';

import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  totalUsers: number;
  pendingRequests: number;
  completedToday: number;
  recentRequests: Array<{
    id: string;
    clientName: string;
    type: string;
    status: string;
    date: string;
  }>;
  requestTrends: {
    labels: string[];
    data: number[];
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingRequests: 0,
    completedToday: 0,
    recentRequests: [],
    requestTrends: {
      labels: [],
      data: [],
    },
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

  const chartData = {
    labels: stats.requestTrends.labels,
    datasets: [
      {
        label: 'Requests',
        data: stats.requestTrends.data,
        borderColor: '#0066CC',
        backgroundColor: 'rgba(0, 102, 204, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

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
        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/40 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold text-[#003366]">Dashboard Overview</h2>
        <div className="flex gap-4">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0066CC]">
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

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

      {/* Request Trends Chart */}
      <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/40">
        <h3 className="text-xl font-bold text-[#003366] mb-6">Request Trends</h3>
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/40">
        <h3 className="text-xl font-bold text-[#003366] mb-6">Recent Requests</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.clientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-[#0066CC] hover:text-[#0052a3]">
                      <DocumentTextIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 