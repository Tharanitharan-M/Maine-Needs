'use client';

import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { ChangeEvent } from 'react';

interface DashboardStats {
  totalUsers: number;
  pendingRequests: number;
  completedToday: number;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category?: string;
  description?: string;
  location?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingRequests: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryCategory, setInventoryCategory] = useState('');
  const [inventoryLocation, setInventoryLocation] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        // Count users (caseworkers)
        const usersSnap = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnap.size;

        // Count pending requests
        const pendingSnap = await getDocs(query(collection(db, 'requests'), where('status', '==', 'pending')));
        const pendingRequests = pendingSnap.size;

        // Count completed today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completedSnap = await getDocs(query(collection(db, 'requests'), where('status', '==', 'approved')));
        const completedToday = completedSnap.docs.filter(doc => {
          const submittedAt = doc.data().submittedAt;
          if (!submittedAt) return false;
          const date = new Date(submittedAt);
          return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
          );
        }).length;

        setStats({
          totalUsers,
          pendingRequests,
          completedToday,
        });
      } catch (err) {
        setError('Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    const fetchInventory = async () => {
      try {
        const snap = await getDocs(collection(db, 'inventory'));
        setInventory(
          snap.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            quantity: doc.data().quantity,
            category: doc.data().category,
            description: doc.data().description,
            location: doc.data().location,
          }))
        );
      } catch {
        // ignore inventory errors for dashboard
      }
    };

    fetchStats();
    fetchInventory();
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

  // Unique categories and locations for filters
  const inventoryCategories = Array.from(new Set(inventory.map(i => i.category).filter(Boolean)));
  const inventoryLocations = Array.from(new Set(inventory.map(i => i.location).filter(Boolean)));

  // Filtered inventory for dashboard
  const filteredInventory = inventory.filter(item =>
    (inventoryCategory === '' || item.category === inventoryCategory) &&
    (inventoryLocation === '' || item.location === inventoryLocation) &&
    (inventorySearch === '' ||
      item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(inventorySearch.toLowerCase()))
  );

  // Inventory summary stats
  const totalItems = inventory.length;
  const totalQuantity = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const lowStockItems = inventory.filter(item => item.quantity !== undefined && item.quantity <= 5);

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
      {/* Inventory Overview Section */}
      <div className="bg-gradient-to-br from-[#e0e7ff] via-[#f5f7fa] to-[#c7d2fe] p-8 rounded-2xl shadow-2xl border border-white/40 mt-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-[#003366] mb-1 flex items-center gap-2">
              <span>Inventory Overview</span>
              <span className="inline-block text-lg">📦</span>
            </h3>
            <p className="text-gray-500">Quick glance at your inventory health and stock.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white rounded-lg shadow px-6 py-3 flex flex-col items-center">
              <span className="text-2xl font-bold text-[#003366]">{totalItems}</span>
              <span className="text-xs text-gray-500">Total Items</span>
            </div>
            <div className="bg-white rounded-lg shadow px-6 py-3 flex flex-col items-center">
              <span className="text-2xl font-bold text-[#003366]">{totalQuantity}</span>
              <span className="text-xs text-gray-500">Total Quantity</span>
            </div>
            <div className="bg-white rounded-lg shadow px-6 py-3 flex flex-col items-center">
              <span className="text-2xl font-bold text-[#eab308]">{lowStockItems.length}</span>
              <span className="text-xs text-gray-500">Low Stock (&le; 5)</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Search inventory..."
            value={inventorySearch}
            onChange={e => setInventorySearch(e.target.value)}
            className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900 placeholder-gray-400"
          />
          <select
            className="w-full md:w-1/4 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900 bg-white"
            value={inventoryCategory}
            onChange={e => setInventoryCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {inventoryCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            className="w-full md:w-1/4 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#003366] focus:border-[#003366] text-gray-900 bg-white"
            value={inventoryLocation}
            onChange={e => setInventoryLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            {inventoryLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#003366] uppercase tracking-wide">Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#003366] uppercase tracking-wide">Description</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#003366] uppercase tracking-wide">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#003366] uppercase tracking-wide">Category</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#003366] uppercase tracking-wide">Location</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map(item => (
                <tr key={item.id} className={item.quantity <= 5 ? 'bg-yellow-50' : ''}>
                  <td className="px-4 py-2 font-semibold text-base text-[#003366]">{item.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{item.description || '-'}</td>
                  <td className={`px-4 py-2 text-base ${item.quantity <= 5 ? 'text-[#eab308] font-bold' : 'text-[#003366]'}`}>{item.quantity}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{item.category || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{item.location || '-'}</td>
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">No inventory items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {lowStockItems.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
            <strong>Low Stock Alert:</strong> The following items are low in stock:&nbsp;
            {lowStockItems.map(item => (
              <span key={item.id} className="font-semibold">{item.name} ({item.quantity}){', '}</span>
            ))}
          </div>
        )}
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