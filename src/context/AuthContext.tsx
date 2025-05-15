'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Get the ID token result to check custom claims
          const idTokenResult = await getIdTokenResult(user);
          const isAdminUser = idTokenResult.claims.admin === true;
          setIsAdmin(isAdminUser);

          // Handle routing based on user role and current path
          if (isAdminUser) {
            if (pathname === '/admin/login') {
              router.push('/admin');
            } else if (!pathname.startsWith('/admin')) {
              router.push('/admin');
            }
          } else {
            if (pathname === '/admin' || pathname.startsWith('/admin/')) {
              router.push('/form');
            } else if (pathname === '/login' || pathname === '/') {
              router.push('/form');
            }
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        // Handle unauthenticated routing
        if (pathname.startsWith('/admin')) {
          router.push('/admin/login');
        } else if (pathname !== '/login') {
          router.push('/login');
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 