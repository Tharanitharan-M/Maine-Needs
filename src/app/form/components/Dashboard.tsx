'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getDocs, collection, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useAuth } from '@/context/AuthContext';

interface Request {
  id: string;
  clientName: string;
  clientAge?: number;
  items: string;
  notes?: string;
  status: string;
  submittedAt: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user === undefined) {
      setLoading(true);
      return;
    }
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }
    let unsubscribed = false;
    const fetchRequests = async () => {
      setLoading(true);
      setError('');
      try {
        // Defensive: Only run query if user.uid exists
        if (!user.uid) {
          setRequests([]);
          setLoading(false);
          return;
        }
        const q = query(
          collection(db, 'requests'),
          orderBy('submittedAt', 'desc'),
          where('caseworker.uid', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        if (unsubscribed) return;
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Request[];
        setRequests(data);
      } catch (err: any) {
        setError('Failed to fetch requests.');
        // Log error for debugging
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line no-console
          console.error('Error fetching requests:', err?.message || err);
        }
      } finally {
        if (!unsubscribed) setLoading(false);
      }
    };
    fetchRequests();
    return () => {
      unsubscribed = true;
    };
  }, [user]);

  const filteredRequests = requests.filter(request =>
    (request.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (request.items || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (request.status || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (user === undefined || loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-[#003366]">Request Dashboard</h2>
        <div className="bg-white p-6 rounded-lg shadow animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-[#003366]">Request Dashboard</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-center text-gray-500">Please log in to view your requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#003366]">Request Dashboard</h2>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0066CC] focus:border-[#0066CC] text-gray-900 placeholder-gray-400"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Families</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Array.isArray((request as any).families) && (request as any).families.length > 0 ? (
                      <div className="space-y-2">
                        {(request as any).families.map((fam: any, idx: number) => (
                          <div key={idx} className="border-b pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                            <div>
                              <span className="font-semibold">Client Name:</span> {fam.clientName || '-'}
                            </div>
                            <div>
                              <span className="font-semibold">Items:</span>{' '}
                              {Array.isArray(fam.items)
                                ? fam.items.map((item: any, i: number) => (
                                    <span key={i}>
                                      {item.name} {item.description ? `(${item.description})` : item.quantity ? `x${item.quantity}` : ''}
                                      {i < fam.items.length - 1 ? ', ' : ''}
                                    </span>
                                  ))
                                : '-'}
                            </div>
                            <div>
                              <span className="font-semibold">Notes:</span> {fam.notes || '-'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Fallback for legacy requests
                      <div>
                        <div>
                          <span className="font-semibold">Client Name:</span> {request.clientName || '-'}
                        </div>
                        <div>
                          <span className="font-semibold">Items:</span>{' '}
                          {Array.isArray(request.items)
                            ? request.items.map((item: any, idx: number) => (
                                <span key={idx}>
                                  {item.name} {item.description ? `(${item.description})` : item.quantity ? `x${item.quantity}` : ''}
                                  {idx < request.items.length - 1 ? ', ' : ''}
                                </span>
                              ))
                            : typeof request.items === 'string'
                            ? request.items.split('\n').map((item: string, idx: number) => (
                                <span key={idx}>{item}{idx < request.items.split('\n').length - 1 ? ', ' : ''}</span>
                              ))
                            : '-'}
                        </div>
                        <div>
                          <span className="font-semibold">Notes:</span> {request.notes || '-'}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      request.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.submittedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-400">No requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}