'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaClipboardList, FaChartBar, FaSignOutAlt } from 'react-icons/fa';
import { NewRequest, Dashboard } from './components';

type Section = 'new-request' | 'dashboard';

export default function FormPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('new-request');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'new-request':
        return <NewRequest />;
      case 'dashboard':
        return <Dashboard />;
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
            <h1 className="text-2xl font-bold">Case Worker Portal</h1>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <button
              onClick={() => setActiveSection('new-request')}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'new-request'
                  ? 'bg-[#0066CC] text-white'
                  : 'text-white/80 hover:bg-[#0066CC]/20'
              }`}
            >
              <FaClipboardList className="w-6 h-6 mr-3" />
              New Request
            </button>
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'dashboard'
                  ? 'bg-[#0066CC] text-white'
                  : 'text-white/80 hover:bg-[#0066CC]/20'
              }`}
            >
              <FaChartBar className="w-6 h-6 mr-3" />
              Dashboard
            </button>
          </nav>
          <div className="p-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-lg text-white/80 hover:bg-[#0066CC]/20 transition-colors"
            >
              <FaSignOutAlt className="w-6 h-6 mr-3" />
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