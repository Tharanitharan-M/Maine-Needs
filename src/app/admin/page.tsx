'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { HomeIcon, UsersIcon, ClipboardDocumentListIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Dashboard, UserManagement, Requests } from './components';

type Section = 'dashboard' | 'users' | 'requests';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const { isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UserManagement />;
      case 'requests':
        return <Requests />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-[#003366] text-white">
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'dashboard'
                  ? 'bg-[#0066CC] text-white'
                  : 'text-white/80 hover:bg-[#0066CC]/20'
              }`}
            >
              <HomeIcon className="w-6 h-6 mr-3" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveSection('users')}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'users'
                  ? 'bg-[#0066CC] text-white'
                  : 'text-white/80 hover:bg-[#0066CC]/20'
              }`}
            >
              <UsersIcon className="w-6 h-6 mr-3" />
              Manage Users
            </button>
            <button
              onClick={() => setActiveSection('requests')}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'requests'
                  ? 'bg-[#0066CC] text-white'
                  : 'text-white/80 hover:bg-[#0066CC]/20'
              }`}
            >
              <ClipboardDocumentListIcon className="w-6 h-6 mr-3" />
              Requests
            </button>
          </nav>
          <div className="p-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-lg text-white/80 hover:bg-[#0066CC]/20 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-6 h-6 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {renderContent()}
      </div>
    </div>
  );
} 