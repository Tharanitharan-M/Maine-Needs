'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaClipboardList, FaChartBar, FaSignOutAlt } from 'react-icons/fa';
import { NewRequest, Dashboard, RequestItemsForm } from './components';

type Section = 'request-items' | 'dashboard';

export default function FormPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('request-items');

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
      case 'request-items':
        return <RequestItemsForm />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen flex overflow-hidden bg-gradient-to-br from-[#e0e7ff] via-[#f5f7fa] to-[#c7d2fe]">
      {/* Animated floating shapes background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-[#0B3768] blur-3xl opacity-60 animate-float1" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[350px] h-[350px] rounded-full bg-[#0066CC] blur-3xl opacity-40 animate-float2" />
      </div>
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gradient-to-br from-[#18345b]/95 via-[#0B3768]/90 to-[#18345b]/95 shadow-2xl border-r-2 border-white/10 rounded-none lg:rounded-r-2xl z-10 flex flex-col h-full">
        <div className="p-8 flex flex-col items-center">
          <h1 className="text-3xl font-extrabold text-white mb-6">Case Worker Portal</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveSection('request-items')}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2 ${activeSection === 'request-items' ? 'bg-[#0066CC] text-white' : 'text-white/80 hover:bg-[#0066CC]/20'}`}
            aria-label="Request Items"
          >
            <FaClipboardList className="w-6 h-6 mr-3" aria-hidden />
            Request Items
          </button>
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2 ${activeSection === 'dashboard' ? 'bg-[#0066CC] text-white' : 'text-white/80 hover:bg-[#0066CC]/20'}`}
            aria-label="Dashboard"
          >
            <FaChartBar className="w-6 h-6 mr-3" aria-hidden />
            Dashboard
          </button>
        </nav>
        <div className="p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 rounded-lg text-white/80 hover:bg-[#0066CC]/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2"
            aria-label="Logout"
          >
            <FaSignOutAlt className="w-6 h-6 mr-3" aria-hidden />
            Logout
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="ml-64 p-8 flex-1 z-10">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}