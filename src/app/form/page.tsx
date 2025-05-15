'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function FormPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="w-full flex justify-end p-4">
        <button
          onClick={handleLogout}
          className="bg-[#003366] text-white px-4 py-2 rounded hover:bg-[#0052A3] font-semibold"
        >
          Logout
        </button>
      </div>
      <div className="flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow text-2xl font-bold text-[#003366]">
          Caseworker Form Page
        </div>
      </div>
    </div>
  );
} 